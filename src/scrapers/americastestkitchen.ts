import * as v from "valibot";

import { AbstractScraper } from "~/abstract-scraper";
import type { Ingredients, RecipeFields } from "~/types/recipe.interface";
import {
	createIngredientGroup,
	createIngredientItem,
	flattenIngredients,
	groupIngredients,
} from "~/utils/ingredients";
import { createInstructionGroup, createInstructionItem } from "~/utils/instructions";
import { normalizeString } from "~/utils/parsing";

const recipeIngredientItemSchema = v.object({
	fields: v.object({
		qty: v.string(),
		preText: v.string(),
		postText: v.string(),
		measurement: v.nullable(v.string()),
		pluralIngredient: v.boolean(),
		ingredient: v.object({
			contentType: v.string(),
			fields: v.object({
				title: v.string(),
				pluralTitle: v.string(),
				kind: v.string(),
			}),
		}),
	}),
});

type RecipeIngredientItem = v.InferOutput<typeof recipeIngredientItemSchema>;

const recipeIngredientGroupSchema = v.object({
	fields: v.object({
		title: v.string(),
		recipeIngredientItems: v.array(recipeIngredientItemSchema),
	}),
});

const recipeInstructionSchema = v.object({
	fields: v.object({
		content: v.string(),
	}),
});

const recipeDataSchema = v.object({
	totalCookTime: v.number(),
	recipeTimeNote: v.optional(v.string()),
	ingredientGroups: v.array(recipeIngredientGroupSchema),
	headnote: v.optional(v.string()),
	instructions: v.array(recipeInstructionSchema),
	metaData: v.object({
		fields: v.object({
			photo: v.object({
				url: v.pipe(v.string(), v.url()),
			}),
		}),
	}),
});

type RecipeData = v.InferOutput<typeof recipeDataSchema>;

const pagePropsDataSchema = v.object({
	props: v.object({
		pageProps: v.object({
			data: recipeDataSchema,
		}),
	}),
});

export class AmericasTestKitchen extends AbstractScraper {
	private data: RecipeData | null = null;

	static host() {
		return "americastestkitchen.com";
	}

	extractors = {
		image: this.image.bind(this),
		ingredients: this.ingredients.bind(this),
		instructions: this.instructions.bind(this),
		siteName: this.siteName.bind(this),
	};

	protected siteName(): RecipeFields["siteName"] {
		return "America's Test Kitchen";
	}

	protected image(prevValue: RecipeFields["image"] | undefined): RecipeFields["image"] {
		const data = this.getRecipeData();

		if (!data) {
			if (prevValue) {
				return prevValue;
			}
			throw new Error("Failed to extract image");
		}

		return data.metaData.fields.photo.url;
	}

	protected ingredients(
		prevValue: RecipeFields["ingredients"] | undefined,
	): RecipeFields["ingredients"] {
		// First try to parse structured data
		// If that fails, try to parse HTML ingredients
		let ingredients = this.parseIngredients();

		if (!ingredients) {
			ingredients = this.parseHtmlIngredients(prevValue);
		}

		if (!ingredients) {
			throw new Error("Failed to extract ingredients");
		}

		return ingredients;
	}

	protected instructions(
		prevValue: RecipeFields["instructions"] | undefined,
	): RecipeFields["instructions"] {
		const data = this.getRecipeData();

		if (!data) {
			if (prevValue) {
				return prevValue;
			}
			throw new Error("Failed to extract instructions");
		}

		const { headnote } = data;

		const items: string[] = [];

		if (headnote) {
			items.push(`Note: ${normalizeString(headnote)}`);
		}

		for (const instruction of data.instructions) {
			items.push(normalizeString(instruction.fields.content));
		}

		return [createInstructionGroup(null, items.map(createInstructionItem))];
	}

	private parseHtmlIngredients(
		prevValue: RecipeFields["ingredients"] | undefined,
	): RecipeFields["ingredients"] | null {
		// Use wildcard selectors to handle dynamic class name suffixes
		const headingSelector = '[class*="RecipeIngredientGroups_group"] > span';
		const ingredientSelector = '[class*="RecipeIngredient"] label';

		if (prevValue && prevValue.length > 0) {
			const values = flattenIngredients(prevValue);
			return groupIngredients(this.$, values, headingSelector, ingredientSelector);
		}

		return null;
	}

	private getRecipeData(): RecipeData | null {
		if (this.data === null) {
			const jsonElement = this.$('script[type="application/json"]');
			const jsonString = jsonElement.html();

			if (!jsonString) {
				this.logger.warn("Could not find JSON data script tag");
				return null;
			}

			try {
				const parsed = v.parse(pagePropsDataSchema, JSON.parse(jsonString));
				this.data = parsed.props.pageProps.data;
			} catch (error) {
				this.logger.error("Failed to parse JSON data:", error);
				return null;
			}
		}

		return this.data;
	}

	private parseIngredientItem(ingredientItem: RecipeIngredientItem): string {
		const { fields } = ingredientItem;
		const fragments = [
			fields.qty || "",
			fields.measurement || "",
			fields.ingredient.fields.title || "",
			fields.postText || "",
		];

		const filteredFragments: string[] = [];

		for (const fragment of fragments) {
			if (fragment) {
				filteredFragments.push(fragment.trimEnd());
			}
		}

		return filteredFragments.join(" ").trimEnd().replace(" ,", ",");
	}

	private parseIngredients(): RecipeFields["ingredients"] | null {
		const data = this.getRecipeData();

		if (!data) {
			return null;
		}

		const { ingredientGroups } = data;

		const result: Ingredients = [];

		for (const group of ingredientGroups) {
			const groupTitle = group.fields.title.length === 0 ? null : group.fields.title;
			const items = group.fields.recipeIngredientItems.map((item) =>
				createIngredientItem(this.parseIngredientItem(item)),
			);

			result.push(createIngredientGroup(groupTitle, items));
		}

		return result;
	}
}
