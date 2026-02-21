import type { HTMLElement } from "node-html-parser";

export abstract class AbstractPlugin {
	/** The name of the plugin */
	abstract name: string;

	/** The priority of the plugin */
	abstract priority: number;

	constructor(readonly $: HTMLElement) {}
}
