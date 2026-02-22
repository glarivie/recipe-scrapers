import * as v from "valibot";

const MAX_STRING_LENGTH = 5000;

const HOSTNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

/**
 * Helper to create a required, non-empty string field
 */
export const vString = (fieldName: string, { min = 1, max = 0 } = {}) => {
	const resolvedMax = max > 0 ? max : MAX_STRING_LENGTH;
	return v.pipe(
		v.string(`${fieldName} must be a string`),
		v.minLength(min, `${fieldName} cannot be empty`),
		v.maxLength(resolvedMax, `${fieldName} must be less than ${resolvedMax} characters`),
		v.transform((s) => s.trim()),
	);
};

/**
 * Helper to create a URL string field
 */
export const vHttpUrl = (fieldName: string) =>
	v.pipe(v.string(`${fieldName} must be a valid URL`), v.url(`${fieldName} must be a valid URL`));

/**
 * Helper to create a hostname field
 */
export const vHostname = (message: string) =>
	v.pipe(v.string(message), v.regex(HOSTNAME_REGEX, message));

/**
 * Helper to create a positive integer field
 */
export const vPositiveInteger = (fieldName: string) =>
	v.nullable(
		v.pipe(
			v.number(`${fieldName} must be an integer`),
			v.integer(`${fieldName} must be an integer`),
			v.minValue(1, `${fieldName} must be positive`),
		),
	);

export const vNonEmptyArray = <T extends v.GenericSchema>(schema: T, fieldName: string) =>
	v.pipe(
		v.array(schema, `${fieldName} items must be an array`),
		v.minLength(1, `${fieldName} group must have at least one item`),
	);
