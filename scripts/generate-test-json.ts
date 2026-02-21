import path from "node:path";
import { LogLevel } from "../src/logger";
import { scrapers } from "../src/scrapers/_index";

const DATA_DIR = path.resolve(import.meta.dir, "../test-data");

async function main() {
	const hosts = process.argv.slice(2);

	if (hosts.length === 0) {
		console.error("Usage: bun scripts/generate-test-json.ts <host1> [host2] ...");
		process.exit(1);
	}

	for (const host of hosts) {
		const Scraper = scrapers[host as keyof typeof scrapers];

		if (!Scraper) {
			console.error(`No scraper found for host: ${host}`);
			continue;
		}

		const hostDir = path.join(DATA_DIR, host);
		const glob = new Bun.Glob("*.testhtml");

		for await (const file of glob.scan(hostDir)) {
			const htmlPath = path.join(hostDir, file);
			const jsonPath = htmlPath.replace(".testhtml", ".json");
			const html = await Bun.file(htmlPath).text();

			try {
				const scraper = new Scraper(html, host, {
					logLevel: LogLevel.ERROR,
				});
				const data = await scraper.toRecipeObject();
				await Bun.write(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
				console.log(`Generated: ${path.relative(DATA_DIR, jsonPath)}`);
			} catch (err) {
				console.error(`Failed: ${file}`, err);
			}
		}
	}
}

await main();
