import { parse } from "node-html-parser";
import { describe, expect, it, vi } from "vitest";

import type { ExtractorPlugin } from "../abstract-extractor-plugin";
import { ExtractionFailedException, ExtractorNotFoundException } from "../exceptions";
import { Logger } from "../logger";
import { RecipeExtractor } from "../recipe-extractor";
import type { RecipeFields } from "../types/recipe.interface";

describe("RecipeExtractor", () => {
	const scraperName = "TestScraper";

	it("uses a single plugin to extract a field", async () => {
		const pluginA = {
			name: "PluginA",
			priority: 10,
			$: parse("<html><body></body></html>"),
			supports: (field: keyof RecipeFields) => field === "title",
			extract: async (_: keyof RecipeFields) => "PluginA-Name",
		} as ExtractorPlugin;

		const extractor = new RecipeExtractor([pluginA], scraperName);
		const result = await extractor.extract("title");
		expect(result).toBe("PluginA-Name");
	});

	it("respects plugin priority (higher first)", async () => {
		// lower priority returns L1, higher priority returns H1
		const low = {
			name: "Low",
			priority: 1,
			$: parse("<html><body></body></html>"),
			supports: () => true,
			extract: () => "L1",
		} as ExtractorPlugin;
		const high = {
			name: "High",
			priority: 100,
			$: parse("<html><body></body></html>"),
			supports: () => true,
			extract: () => "H1",
		} as ExtractorPlugin;

		const spyLow = vi.spyOn(low, "extract");
		const spyHigh = vi.spyOn(high, "extract");

		const extractor = new RecipeExtractor([low, high], scraperName);
		const result = await extractor.extract("title");
		expect(result).toBe("H1");
		expect(spyHigh).toHaveBeenCalled();
		expect(spyLow).not.toHaveBeenCalled();
	});

	it("uses site-specific extractor when provided", async () => {
		const plugin = {
			name: "X",
			priority: 0,
			$: parse("<html><body></body></html>"),
			supports: () => false,
			extract: () => "X",
		} as ExtractorPlugin;

		const extractor = new RecipeExtractor([plugin], scraperName);
		const siteValue = await extractor.extract("title", (prev) => {
			expect(prev).toBeUndefined();
			return "SiteName";
		});
		expect(siteValue).toBe("SiteName");
	});

	it("chains plugin result into site-specific extractor", async () => {
		const plugin = {
			name: "P",
			priority: 0,
			$: parse("<html><body></body></html>"),
			supports: () => true,
			extract: () => "FromPlugin",
		} as ExtractorPlugin;

		const extractor = new RecipeExtractor([plugin], scraperName);
		const final = await extractor.extract("title", (prev) => {
			expect(prev).toBe("FromPlugin");
			return `${prev}-Site`;
		});
		expect(final).toBe("FromPlugin-Site");
	});

	it("throws ExtractorNotFoundException when no plugin or extractor applies", async () => {
		const plugin = {
			name: "None",
			priority: 0,
			$: parse("<html><body></body></html>"),
			supports: () => false,
			extract: () => "X",
		} as ExtractorPlugin;

		const extractor = new RecipeExtractor([plugin], scraperName);
		await expect(extractor.extract("title")).rejects.toThrow(ExtractorNotFoundException);
		await expect(extractor.extract("title")).rejects.toThrow("No extractor found for field: title");
	});

	it("logs unexpected plugin errors as warnings and falls through", async () => {
		const plugin = {
			name: "Broken",
			priority: 10,
			$: parse("<html><body></body></html>"),
			supports: () => true,
			extract: () => {
				throw new TypeError("Cannot read properties of undefined");
			},
		} as ExtractorPlugin;

		const warnSpy = vi.spyOn(Logger.prototype, "warn");

		const extractor = new RecipeExtractor([plugin], scraperName);
		await expect(extractor.extract("title")).rejects.toThrow(ExtractorNotFoundException);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('Unexpected error extracting "title"'),
			expect.any(TypeError),
		);

		warnSpy.mockRestore();
	});

	it("handles ExtractionFailedException from plugins gracefully", async () => {
		const plugin = {
			name: "Missing",
			priority: 10,
			$: parse("<html><body></body></html>"),
			supports: () => true,
			extract: () => {
				throw new ExtractionFailedException("title");
			},
		} as ExtractorPlugin;

		const debugSpy = vi.spyOn(Logger.prototype, "debug");

		const extractor = new RecipeExtractor([plugin], scraperName);
		await expect(extractor.extract("title")).rejects.toThrow(ExtractorNotFoundException);
		expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("title"));

		debugSpy.mockRestore();
	});

	it("logs unexpected site-extractor errors as warnings and falls through", async () => {
		const plugin = {
			name: "X",
			priority: 0,
			$: parse("<html><body></body></html>"),
			supports: () => false,
			extract: () => "X",
		} as ExtractorPlugin;

		const warnSpy = vi.spyOn(Logger.prototype, "warn");

		const extractor = new RecipeExtractor([plugin], scraperName);
		await expect(
			extractor.extract("title", () => {
				throw new RangeError("out of range");
			}),
		).rejects.toThrow(ExtractorNotFoundException);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('Unexpected error in site extractor for "title"'),
			expect.any(RangeError),
		);

		warnSpy.mockRestore();
	});
});
