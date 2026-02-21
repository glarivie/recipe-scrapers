/*******************************************************************************
 * Utility functions for common parsing tasks
 ******************************************************************************/
import { parse as parseDuration } from "tinyduration";

export function normalizeString(str: string | null | undefined): string {
	return (
		str
			?.trim()
			// collapse all whitespace to single spaces
			.replace(/\s+/g, " ")
			// remove any space(s) immediately before a comma
			.replace(/\s+,/g, ",") ?? ""
	);
}

export function splitToList(value: string, separator: string | RegExp): string[] {
	if (!value) {
		return [];
	}

	const items: string[] = [];

	for (const item of value.split(separator)) {
		const str = normalizeString(item);

		if (str) {
			items.push(str);
		}
	}

	return items;
}

/**
 * @TODO Implement [Temporal.Duration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration) once it lands.
 */
export function parseMinutes(value: string) {
	const { days, hours, minutes, seconds } = parseDuration(value);
	const totalSeconds =
		(days ?? 0) * 86400 + (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
	return Math.round(totalSeconds / 60);
}
