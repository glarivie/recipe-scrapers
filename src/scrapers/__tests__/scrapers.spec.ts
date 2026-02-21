import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import { describe, expect, it } from "vitest";
import z from "zod";

import { AbstractScraper } from "~/abstract-scraper";
import { LogLevel } from "~/logger";
import { scrapers } from "~/scrapers/_index";
import type { RecipeObject } from "~/types/recipe.interface";

const DATA_DIR = "./test-data";

function getTestDataFiles() {
	const files = globSync("**/*.testhtml", { cwd: DATA_DIR });

	// Group files by host (directory name)
	const hostGroups = new Map<string, { html: string[]; json: string[] }>();

	for (const file of files) {
		const { dir } = path.parse(file);
		const host = hostGroups.get(dir);
		const testHtmlPath = path.join(DATA_DIR, file);
		const testJsonPath = testHtmlPath.replace(".testhtml", ".json");

		if (!existsSync(testJsonPath)) {
			console.warn(`Skipping ${testHtmlPath}: corresponding JSON file not found`);
			continue;
		}

		if (!host) {
			hostGroups.set(dir, { html: [testHtmlPath], json: [testJsonPath] });
		} else {
			host.html.push(testHtmlPath);
			host.json.push(testJsonPath);
		}
	}

	return hostGroups;
}

function runTestSuite(host: string, htmlFiles: string[], jsonFiles: string[]) {
	const Scraper = scrapers[host];

	describe(`Scraper: ${host}`, () => {
		it("should be defined", () => {
			expect(Scraper).toBeDefined();
		});

		it("should be an instance of AbstractScraper", () => {
			expect(new Scraper("", "")).toBeInstanceOf(AbstractScraper);
		});

		it("should have a valid host", () => {
			expect(Scraper.host()).toBe(host);
		});

		it("should have test data files", () => {
			expect(htmlFiles.length).toBeGreaterThan(0);
			expect(htmlFiles.length).toBe(jsonFiles.length);
		});

		for (let i = 0; i < htmlFiles.length; i++) {
			const htmlFile = htmlFiles[i];
			const jsonFile = jsonFiles[i];
			const { base: fileName } = path.parse(htmlFile);
			const htmlContent = readFileSync(htmlFile, "utf-8");
			const expectedData: RecipeObject = JSON.parse(readFileSync(jsonFile, "utf-8"));

			describe(fileName, () => {
				it("should correctly parse and validate the recipe", async () => {
					const scraper = new Scraper(htmlContent, host, {
						logLevel: LogLevel.WARN,
					});
					const data = await scraper.toRecipeObject();
					expect(data).toEqual(expectedData);

					const parsedResult = await scraper.safeParse();

					if (!parsedResult.success) {
						console.error(z.prettifyError(parsedResult.error));
					}

					expect(parsedResult.success).toBe(true);

					if (parsedResult.success) {
						expect(parsedResult.data).toMatchObject(expectedData);
					}
				});
			});
		}
	});
}

const testDataFiles = getTestDataFiles();

const onlyScraper = ""; //'epicurious.com'

console.log(`Running tests for scraper: ${onlyScraper || "all"}`);

for (const [host, { html, json }] of testDataFiles) {
	if (onlyScraper && host !== onlyScraper) {
		continue;
	}
	runTestSuite(host, html, json);
}
