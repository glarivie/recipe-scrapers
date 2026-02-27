import { scrapers } from "./scrapers/_index";
import { getHostName } from "./utils";

// Public API
export { scrapers };

// Schema & validation
export { RECIPE_SCHEMA_VERSION, RecipeObjectSchema } from "~/schemas/recipe.schema";
// Types
export type {
	IngredientGroup,
	IngredientItem,
	Ingredients,
	InstructionGroup,
	InstructionItem,
	Instructions,
	Link,
	RecipeData,
	RecipeFields,
	RecipeObject,
} from "~/types/recipe.interface";
export type { ScraperOptions } from "~/types/scraper.interface";

export { ExtractorPlugin } from "./abstract-extractor-plugin";
export { PostProcessorPlugin } from "./abstract-postprocessor-plugin";
// Extension points
export { AbstractScraper } from "./abstract-scraper";
export { LogLevel } from "./logger";

/**
 * Returns a scraper class for the given URL, if implemented.
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
