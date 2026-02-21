import * as v from "valibot";

import { isNull } from "~/utils";

import { vHostname, vHttpUrl, vNonEmptyArray, vPositiveInteger, vString } from "./common.schema";

/**
 * Current schema version for recipe objects.
 * Increment this when making breaking changes to the schema.
 *
 * Version history:
 * - 1.0.0: Initial schema version
 */
export const RECIPE_SCHEMA_VERSION = "1.0.0" as const;

/**
 * Schema for a parsed ingredient from the parse-ingredient library.
 * This represents the structured data extracted from an ingredient string.
 * @see https://github.com/jakeboone02/parse-ingredient
 */
export const ParsedIngredientSchema = v.object({
	/** The primary quantity (the lower quantity in a range, if applicable) */
	quantity: v.nullable(v.number()),
	/** The secondary quantity (the upper quantity in a range, or null if not
	 * applicable) */
	quantity2: v.nullable(v.number()),
	/** The unit of measure identifier (normalized key) */
	unitOfMeasureID: v.nullable(v.string()),
	/** The unit of measure as written in the ingredient string */
	unitOfMeasure: v.nullable(v.string()),
	/** The ingredient description (name of the ingredient) */
	description: v.string(),
	/** Whether the "ingredient" is actually a group header, e.g. "For icing:" */
	isGroupHeader: v.boolean(),
});

/**
 * Schema for a single ingredient item
 */
export const IngredientItemSchema = v.object({
	value: vString("Ingredient value"),
	/**
	 * Parsed ingredient data from the parse-ingredient library.
	 * Only present when parsing is enabled via `parseIngredients` option.
	 */
	parsed: v.optional(v.nullable(ParsedIngredientSchema)),
});

/**
 * Schema for a group of ingredients
 */
export const IngredientGroupSchema = v.object({
	name: v.nullable(vString("Ingredient group name")),
	items: vNonEmptyArray(IngredientItemSchema, "Ingredient"),
});

/**
 * Schema for all recipe ingredients
 * Must have at least one group with at least one ingredient
 */
export const IngredientsSchema = v.pipe(
	v.array(IngredientGroupSchema, "Ingredients must be an array"),
	v.minLength(1, "Recipe must have at least one ingredient group"),
);

/**
 * Schema for a single instruction step
 */
export const InstructionItemSchema = v.object({
	value: vString("Instruction value"),
});

/**
 * Schema for a group of instruction steps
 */
export const InstructionGroupSchema = v.object({
	name: v.nullable(vString("Instruction group name")),
	items: vNonEmptyArray(InstructionItemSchema, "Instruction"),
});

/**
 * Schema for all recipe instructions
 * Must have at least one group with at least one step
 */
export const InstructionsSchema = v.pipe(
	v.array(InstructionGroupSchema, "Instructions must be an array"),
	v.minLength(1, "Recipe must have at least one instruction group"),
);

/**
 * Schema for a link object
 */
export const LinkSchema = v.object({
	href: vHttpUrl("Link href"),
	text: vString("Link text"),
});

/**
 * Base RecipeObject schema without cross-field validations.
 */
export const RecipeObjectBaseSchema = v.object({
	// Schema version for migrations
	schemaVersion: v.optional(v.literal(RECIPE_SCHEMA_VERSION), RECIPE_SCHEMA_VERSION),

	// Required fields
	host: vHostname("Host must be a valid hostname"),

	title: vString("Title", { max: 500 }),

	author: vString("Author", { max: 255 }),

	ingredients: IngredientsSchema,
	instructions: InstructionsSchema,

	// URL fields
	canonicalUrl: vHttpUrl("Canonical URL"),
	image: vHttpUrl("Image"),

	// Time fields (in minutes)
	totalTime: vPositiveInteger("Total time"),
	cookTime: vPositiveInteger("Cook time"),
	prepTime: vPositiveInteger("Prep time"),

	// Ratings
	ratings: v.optional(
		v.pipe(
			v.number("Ratings must be a number"),
			v.minValue(0, "Ratings must be at least 0"),
			v.maxValue(5, "Ratings must be at most 5"),
		),
		0,
	),

	ratingsCount: v.optional(
		v.pipe(
			v.number("Ratings count must be a number"),
			v.integer("Ratings count must be an integer"),
			v.minValue(0, "Ratings count must be non-negative"),
		),
		0,
	),

	// String fields
	yields: vString("Yields"),
	description: vString("Description"),

	language: v.optional(vString("Language", { min: 2 }), "en"),

	siteName: v.nullable(vString("Site name")),

	cookingMethod: v.nullable(vString("Cooking method")),

	// List fields
	category: v.optional(v.array(vString("Category item"), "Category must be an array"), []),

	cuisine: v.optional(v.array(vString("Cuisine item"), "Cuisine must be an array"), []),

	keywords: v.optional(v.array(vString("Keyword item"), "Keywords must be an array"), []),

	dietaryRestrictions: v.optional(
		v.array(vString("Dietary restriction item"), "Dietary restrictions must be an array"),
		[],
	),

	equipment: v.optional(v.array(vString("Equipment item"), "Equipment must be an array"), []),

	links: v.optional(v.array(LinkSchema, "Links must be an array")),

	// Complex fields
	nutrients: v.optional(
		v.record(v.string(), v.string(), "Nutrients must be an object"),
		() => ({}),
	),

	reviews: v.optional(v.record(v.string(), v.string(), "Reviews must be an object"), () => ({})),
});

type RecipeObjectBase = v.InferOutput<typeof RecipeObjectBaseSchema>;

/**
 * Applies recipe-specific transformations and validations to a schema.
 */
export function applyRecipeValidations(schema: v.GenericSchema<unknown, RecipeObjectBase>) {
	return v.pipe(
		schema,
		v.transform((data) => {
			// Auto-fix: calculate totalTime if missing but cook and prep times exist
			if (!data.totalTime && !isNull(data.cookTime) && !isNull(data.prepTime)) {
				data.totalTime = data.cookTime + data.prepTime;
			}
			return data;
		}),
		v.check(({ totalTime, cookTime, prepTime }) => {
			if (!isNull(totalTime) && !isNull(cookTime) && !isNull(prepTime)) {
				return totalTime >= cookTime + prepTime;
			}
			return true;
		}, "Total time should be at least the sum of cook time and prep time"),
		v.check((data) => {
			return data.ratings === 0 || data.ratingsCount > 0;
		}, "Ratings count should be greater than 0 when ratings exist"),
	);
}

/**
 * Strict RecipeObject schema with all validations enforced.
 * This is the standard schema used by recipe scrapers.
 */
export const RecipeObjectSchema = applyRecipeValidations(RecipeObjectBaseSchema);
