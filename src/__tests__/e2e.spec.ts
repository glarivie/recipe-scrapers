import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getScraper } from "~/index";
import { LogLevel } from "~/logger";
import type { RecipeObject } from "~/types/recipe.interface";

/**
 * E2E integration tests — exercise the full pipeline from
 * getScraper → new Scraper(html, url) → parse() → validated output.
 */

const fixtures = {
	allrecipes: {
		html: readFileSync("test-data/allrecipes.com/allrecipescurated.testhtml", "utf-8"),
		expected: JSON.parse(
			readFileSync("test-data/allrecipes.com/allrecipescurated.json", "utf-8"),
		) as RecipeObject,
		url: "https://www.allrecipes.com/recipe/12345",
	},
	epicurious: {
		html: readFileSync("test-data/epicurious.com/epicurious.testhtml", "utf-8"),
		expected: JSON.parse(
			readFileSync("test-data/epicurious.com/epicurious.json", "utf-8"),
		) as RecipeObject,
		url: "https://www.epicurious.com/recipes/food/views/recipe-12345",
	},
};

describe("E2E: full extraction pipeline", () => {
	it("getScraper → instantiate → parse() returns validated RecipeObject", async () => {
		const Scraper = getScraper(fixtures.allrecipes.url);
		const scraper = new Scraper(fixtures.allrecipes.html, fixtures.allrecipes.url, {
			logLevel: LogLevel.WARN,
		});
		const result = await scraper.parse();

		expect(result.schemaVersion).toBe("1.0.0");
		expect(result).toMatchObject(fixtures.allrecipes.expected);
	});

	it("safeParse() returns success with valid data", async () => {
		const Scraper = getScraper(fixtures.epicurious.url);
		const scraper = new Scraper(fixtures.epicurious.html, fixtures.epicurious.url, {
			logLevel: LogLevel.WARN,
		});
		const result = await scraper.safeParse();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output).toMatchObject(fixtures.epicurious.expected);
		}
	});

	it("getScraper() throws for unsupported site", () => {
		expect(() => getScraper("https://not-a-recipe-site.example.com")).toThrow(
			"not currently supported",
		);
	});

	it("post-processors strip HTML from extracted values", async () => {
		const Scraper = getScraper(fixtures.allrecipes.url);
		const scraper = new Scraper(fixtures.allrecipes.html, fixtures.allrecipes.url, {
			logLevel: LogLevel.WARN,
		});
		const data = await scraper.parse();

		// Title should not contain HTML tags
		expect(data.title).not.toMatch(/<[^>]+>/);

		// Description should not contain HTML tags
		if (data.description) {
			expect(data.description).not.toMatch(/<[^>]+>/);
		}
	});

	it("toRecipeObject() produces JSON-serializable output", async () => {
		const Scraper = getScraper(fixtures.allrecipes.url);
		const scraper = new Scraper(fixtures.allrecipes.html, fixtures.allrecipes.url, {
			logLevel: LogLevel.WARN,
		});
		const obj = await scraper.toRecipeObject();

		// Should round-trip through JSON without losing data
		const serialized = JSON.stringify(obj);
		const deserialized = JSON.parse(serialized);
		expect(deserialized).toEqual(obj);

		// Arrays and objects, not Sets/Maps
		expect(Array.isArray(deserialized.category)).toBe(true);
		expect(Array.isArray(deserialized.cuisine)).toBe(true);
		expect(Array.isArray(deserialized.keywords)).toBe(true);
		expect(typeof deserialized.nutrients).toBe("object");
		expect(Array.isArray(deserialized.nutrients)).toBe(false);
	});
});
