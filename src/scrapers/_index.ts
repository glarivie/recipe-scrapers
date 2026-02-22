import { AbstractScraper } from "~/abstract-scraper";

import { AmericasTestKitchen } from "./americastestkitchen";
import { BBCFood } from "./bbcfood";
import { BBCGoodFood } from "./bbcgoodfood";
import { Delish } from "./delish";
import { Epicurious } from "./epicurious";
import { SCHEMA_ORG_HOSTS } from "./hosts";
import { NYTimes } from "./nytimes";
import { SallysBakingAddiction } from "./sallysbakingaddiction";
import { SimplyRecipes } from "./simplyrecipes";
import { Tasty } from "./tasty";
import { ThePioneerWoman } from "./thepioneerwoman";

function createScraper(host: string): typeof AbstractScraper {
	return class extends AbstractScraper {
		static host() {
			return host;
		}
	};
}

const schemaOrgScrapers = Object.fromEntries(
	SCHEMA_ORG_HOSTS.map((host) => [host, createScraper(host)]),
);

/**
 * A map of all scrapers, keyed by hostname.
 *
 * Schema.org-only sites are generated from the hosts list.
 * Custom scrapers override any overlap.
 */
export const scrapers: Record<string, typeof AbstractScraper> = {
	...schemaOrgScrapers,
	[AmericasTestKitchen.host()]: AmericasTestKitchen,
	[BBCFood.host()]: BBCFood,
	"bbc.co.uk": BBCFood,
	[BBCGoodFood.host()]: BBCGoodFood,
	[Delish.host()]: Delish,
	[Epicurious.host()]: Epicurious,
	[NYTimes.host()]: NYTimes,
	[SallysBakingAddiction.host()]: SallysBakingAddiction,
	[SimplyRecipes.host()]: SimplyRecipes,
	[Tasty.host()]: Tasty,
	[ThePioneerWoman.host()]: ThePioneerWoman,
};
