import type { HTMLElement } from "node-html-parser";

interface MicrodataObject {
	"@type"?: string;
	[key: string]: unknown;
}

const addProperty = (obj: Record<string, unknown>, key: string, value: unknown) => {
	if (obj[key] === undefined) {
		obj[key] = value;
	} else if (Array.isArray(obj[key])) {
		obj[key].push(value);
	} else {
		obj[key] = [obj[key], value];
	}
};

const extractValueFromElement = (element: HTMLElement): string | undefined => {
	if (element.rawTagName === "meta") {
		return element.getAttribute("content");
	}

	if (element.rawTagName === "time") {
		return element.getAttribute("datetime") || element.textContent.trim();
	}

	if (element.rawTagName === "img") {
		return element.getAttribute("src");
	}

	if (element.rawTagName === "a") {
		return element.getAttribute("href");
	}

	return element.textContent.trim();
};

const extractSchemaType = (itemType: string): string | undefined => {
	const typeMatch = itemType.match(/schema\.org\/(\w+)/);
	return typeMatch?.[1];
};

/**
 * Extracts microdata from HTML elements using itemtype and itemprop attributes
 *
 * @param root - Parsed HTML root element
 * @param selector - Selector to find elements with microdata
 * @returns Array of extracted microdata objects
 */
export function extractMicrodata(root: HTMLElement, selector: string): MicrodataObject[] {
	const results: MicrodataObject[] = [];
	const elements = root.querySelectorAll(selector);

	for (const el of elements) {
		const itemType = el.getAttribute("itemtype");
		const rootObject: MicrodataObject = {};

		// Set the schema type if available
		if (itemType) {
			const schemaType = extractSchemaType(itemType);
			if (schemaType) {
				rootObject["@type"] = schemaType;
			}
		}

		// Also get itemprop elements that are not inside nested itemtype elements
		const foundProps = el.querySelectorAll("[itemprop]");
		// Check if the element itself has itemprop (addBack behavior)
		const allProps = el.getAttribute("itemprop") ? [el, ...foundProps] : [...foundProps];
		const nestedItemTypes = el.querySelectorAll("[itemtype]");

		// Filter out properties that are inside nested itemtype elements
		const rootLevelProps = allProps.filter((propEl) => {
			// If this element itself has itemtype, it's a nested object
			if (propEl.getAttribute("itemtype")) {
				return true;
			}

			// Check if this property is inside any nested itemtype element
			const isInsideNestedType = nestedItemTypes.some((nestedEl) =>
				nestedEl.querySelectorAll("[itemprop]").some((child) => child === propEl),
			);

			return !isInsideNestedType;
		});

		for (const propEl of rootLevelProps) {
			const propName = propEl.getAttribute("itemprop");
			if (!propName) {
				continue;
			}

			let propValue: string | MicrodataObject | undefined;

			// Check if this element has an itemtype (nested object)
			const nestedItemType = propEl.getAttribute("itemtype");
			if (nestedItemType) {
				const nestedObject: MicrodataObject = {};

				// Set nested schema type
				const nestedSchemaType = extractSchemaType(nestedItemType);
				if (nestedSchemaType) {
					nestedObject["@type"] = nestedSchemaType;
				}

				// Extract properties from nested object (only direct children)
				for (const nestedEl of propEl.querySelectorAll("[itemprop]")) {
					const nestedProp = nestedEl.getAttribute("itemprop");
					if (!nestedProp) {
						continue;
					}

					const nestedValue = extractValueFromElement(nestedEl);
					if (nestedValue && nestedValue !== "") {
						addProperty(nestedObject, nestedProp, nestedValue);
					}
				}

				propValue = nestedObject;
			} else {
				// Handle simple property values
				propValue = extractValueFromElement(propEl);
			}

			if (propValue !== undefined && propValue !== "") {
				addProperty(rootObject, propName, propValue);
			}
		}

		// Only add objects that have properties beyond just @type
		if (
			Object.keys(rootObject).length > 1 ||
			(Object.keys(rootObject).length === 1 && !rootObject["@type"])
		) {
			results.push(rootObject);
		}
	}

	return results;
}

/**
 * Extracts Recipe microdata specifically
 *
 * @param root - Parsed HTML root element
 * @returns Array of recipe microdata objects
 */
export function extractRecipeMicrodata(root: HTMLElement): MicrodataObject[] {
	return extractMicrodata(root, '[itemtype*="schema.org/Recipe"], [itemtype*="Recipe"]');
}
