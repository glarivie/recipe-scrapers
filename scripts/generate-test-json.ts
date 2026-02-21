import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { globSync } from "glob";

import { LogLevel } from "../src/logger";
import { scrapers } from "../src/scrapers/_index";

const DATA_DIR = path.resolve(import.meta.dirname, "../test-data");

async function main() {
	const hosts = process.argv.slice(2);

	if (hosts.length === 0) {
		console.error("Usage: tsx scripts/generate-test-json.ts <host1> [host2] ...");
		process.exit(1);
	}

	for (const host of hosts) {
		const Scraper = scrapers[host as keyof typeof scrapers];

		if (!Scraper) {
			console.error(`No scraper found for host: ${host}`);
			continue;
		}

		const hostDir = path.join(DATA_DIR, host);
		const files = globSync("*.testhtml", { cwd: hostDir });

		for (const file of files) {
			const htmlPath = path.join(hostDir, file);
			const jsonPath = htmlPath.replace(".testhtml", ".json");
			const html = readFileSync(htmlPath, "utf-8");

			try {
				const scraper = new Scraper(html, host, {
					logLevel: LogLevel.ERROR,
				});
				const data = await scraper.toRecipeObject();
				writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
				console.log(`Generated: ${path.relative(DATA_DIR, jsonPath)}`);
			} catch (err) {
				console.error(`Failed: ${file}`, err);
			}
		}
	}
}

await main();
