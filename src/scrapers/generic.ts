import { AbstractScraper } from "~/abstract-scraper";
import type { RecipeData } from "~/types/recipe.interface";
import type { ScraperOptions } from "~/types/scraper.interface";
import { getHostName } from "~/utils";

/**
 * Generic scraper for unsupported sites ("wild mode").
 * Relies entirely on Schema.org / OpenGraph plugin extraction
 * without any site-specific logic.
 *
 * Unlike registered scrapers, the host is derived from the URL
 * passed to the constructor.
 */
export class GenericScraper extends AbstractScraper {
	private readonly hostName: string;

	constructor(html: string, url: string, options?: ScraperOptions) {
		super(html, url, options);
		this.hostName = getHostName(url);
	}

	static host() {
		return "*";
	}

	extractors = {};

	public override async scrape(): Promise<RecipeData> {
		const data = await super.scrape();
		data.host = this.hostName;
		return data;
	}
}
