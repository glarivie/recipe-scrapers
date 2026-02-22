import type { RecipeObject } from "~/types/recipe.interface";
import type { ScraperOptions } from "~/types/scraper.interface";

import { scrapers } from "./scrapers/_index";
import { GenericScraper } from "./scrapers/generic";
import { getHostName } from "./utils";

export * from "~/schemas/recipe.schema";
export * from "~/types/recipe.interface";
export * from "~/types/scraper.interface";

export * from "./abstract-extractor-plugin";
export * from "./abstract-postprocessor-plugin";
export * from "./logger";
export { GenericScraper, scrapers };

/**
 * Returns a scraper class for the given URL, if implemented.
 * Throws if the site is not supported. Use `scrapeRecipe` for wild mode.
 */
export function getScraper(url: string) {
	const hostName = getHostName(url);

	if (scrapers[hostName]) {
		return scrapers[hostName];
	}

	throw new Error(
		`The website '${hostName}' is not currently supported.\nIf you want to help add support, please open an issue!`,
	);
}

/**
 * Scrape a recipe from HTML and validate it.
 * Falls back to generic Schema.org extraction for unsupported sites (wild mode).
 */
export async function scrapeRecipe(
	html: string,
	url: string,
	options?: ScraperOptions,
): Promise<RecipeObject> {
	const hostName = getHostName(url);
	const ScraperClass = scrapers[hostName] ?? GenericScraper;
	const scraper = new ScraperClass(html, url, options);
	return scraper.parse();
}

/**
 * Scrape a recipe from HTML with safe validation (no throw).
 * Falls back to generic Schema.org extraction for unsupported sites (wild mode).
 */
export async function safeScrapeRecipe(html: string, url: string, options?: ScraperOptions) {
	const hostName = getHostName(url);
	const ScraperClass = scrapers[hostName] ?? GenericScraper;
	const scraper = new ScraperClass(html, url, options);
	return scraper.safeParse();
}
