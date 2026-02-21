import type { InstructionGroup, InstructionItem, Instructions } from "@/types/recipe.interface";
import { isPlainObject, isString } from "./index";
import { splitToList } from "./parsing";

/**
 * List of possible headings to remove from instructions.
 */
const INSTRUCTION_HEADINGS = ["Preparation", "Directions", "Instructions", "Method", "Steps"];

/**
 * Creates an InstructionItem.
 */
export function createInstructionItem(value: string): InstructionItem {
	return { value };
}

/**
 * Creates an InstructionGroup.
 */
export function createInstructionGroup(
	name: string | null,
	items: InstructionItem[] = [],
): InstructionGroup {
	return { name, items };
}

/**
 * Type guard to check if value is an InstructionItem.
 */
export function isInstructionItem(value: unknown): value is InstructionItem {
	return isPlainObject(value) && "value" in value && isString(value.value);
}

/**
 * Type guard to check if value is an InstructionGroup.
 */
export function isInstructionGroup(value: unknown): value is InstructionGroup {
	return (
		isPlainObject(value) &&
		"name" in value &&
		"items" in value &&
		Array.isArray(value.items) &&
		value.items.every(isInstructionItem)
	);
}

/**
 * Type guard to check if value is an Instructions array.
 */
export function isInstructions(value: unknown): value is Instructions {
	return Array.isArray(value) && value.every(isInstructionGroup);
}

/**
 * Extracts the flat list of instruction values from an Instructions array.
 * Useful when scrapers need to re-group instructions.
 */
export function flattenInstructions(instructions: Instructions): string[] {
	return instructions.flatMap((group) => group.items.map((item) => item.value));
}

/**
 * Converts an array of strings to an Instructions array with a single
 * default group.
 */
export function stringsToInstructions(
	values: string[],
	groupName: string | null = null,
): Instructions {
	const items = values.map(createInstructionItem);
	return [createInstructionGroup(groupName, items)];
}

/**
 * Removes any heading from the start of the instructions string.
 */
export function removeInstructionHeading(value: string) {
	for (const heading of INSTRUCTION_HEADINGS) {
		const regex = new RegExp(`^\\s*${heading}\\s*:?\\s*`, "i");
		if (regex.test(value)) {
			return value.replace(regex, "");
		}
	}
	return value;
}

/**
 * Splits a recipe instructions string into an array of steps.
 * Removes known headings and trims whitespace.
 */
export function splitInstructions(value: string) {
	if (!value) {
		return [];
	}

	const cleaned = removeInstructionHeading(value).trim();

	// Split on double newlines or paragraph breaks
	let steps = splitToList(cleaned, /\n\s*\n+/);

	// If only one step, try splitting on sentence boundaries as fallback
	if (steps.length === 1) {
		steps = splitToList(cleaned, /(?<=\.)\s+(?=[A-Z])/);
	}

	return steps;
}
