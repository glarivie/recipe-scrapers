import { AbstractScraper } from "~/abstract-scraper";
import type { RecipeFields } from "~/types/recipe.interface";

export class Epicurious extends AbstractScraper {
	static host() {
		return "epicurious.com";
	}

	extractors = {
		author: this.author.bind(this),
	};

	protected author(): RecipeFields["author"] {
		const author = this.$.querySelector('a[itemprop="author"]')?.textContent.trim() ?? "";
		return author;
	}
}
