import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getScraper, safeScrapeRecipe, scrapeRecipe } from "../index";

const allrecipesHtml = readFileSync("test-data/allrecipes.com/allrecipescurated.testhtml", "utf-8");
const allrecipesExpected = JSON.parse(
	readFileSync("test-data/allrecipes.com/allrecipescurated.json", "utf-8"),
);

describe("scrapeRecipe", () => {
	it("scrapes a known host", async () => {
		const result = await scrapeRecipe(allrecipesHtml, "https://www.allrecipes.com/recipe/12345");
		expect(result).toMatchObject(allrecipesExpected);
	});

	it("scrapes an unknown host via wild mode (GenericScraper)", async () => {
		const result = await scrapeRecipe(allrecipesHtml, "https://unknown-recipe-site.example.com/r");
		expect(result.title).toBeDefined();
		expect(result.host).toBe("unknown-recipe-site.example.com");
	});

	it("throws for empty HTML with no recipe data", async () => {
		await expect(
			scrapeRecipe("<html><body>No recipe here</body></html>", "https://example.com/recipe"),
		).rejects.toThrow();
	});
});

describe("safeScrapeRecipe", () => {
	it("returns success for valid recipe HTML", async () => {
		const result = await safeScrapeRecipe(
			allrecipesHtml,
			"https://www.allrecipes.com/recipe/12345",
		);
		expect(result.success).toBe(true);
	});
});

describe("getScraper", () => {
	it("returns a scraper class for a known host", () => {
		const Scraper = getScraper("https://www.allrecipes.com/recipe/12345");
		expect(Scraper.host()).toBe("allrecipes.com");
	});

	it("throws for an unknown host", () => {
		expect(() => getScraper("https://unknown-site.example.com")).toThrow("not currently supported");
	});
});
