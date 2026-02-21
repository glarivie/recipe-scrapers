import { AbstractScraper } from "~/abstract-scraper";
import type { RecipeFields } from "~/types/recipe.interface";

export class BBCFood extends AbstractScraper {
	static host() {
		return "bbc.com";
	}

	extractors = {
		title: this.title.bind(this),
		author: this.author.bind(this),
	};

	protected title(): RecipeFields["title"] {
		return this.$.querySelector("h1")?.textContent.trim() ?? "";
	}

	protected author(): RecipeFields["author"] {
		const container = this.$.querySelector("div.chef__name");
		const link = container?.querySelector("a");
		return link ? link.textContent.trim() : "";
	}
}
