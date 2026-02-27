/**
 * Hosts that rely entirely on Schema.org / OpenGraph extraction
 * and don't need custom scraper logic.
 *
 * To add a new Schema.org-only site, simply append its hostname here.
 * For sites that need custom extractors, create a dedicated scraper file instead.
 */
export const SCHEMA_ORG_HOSTS = [
	"allrecipes.com",
	"bonappetit.com",
	"budgetbytes.com",
	"cookieandkate.com",
	"cookpad.com",
	"cuisineaz.com",
	"damndelicious.net",
	"eatingwell.com",
	"food.com",
	"food52.com",
	"750g.com",
	"halfbakedharvest.com",
	"jow.fr",
	"kingarthurbaking.com",
	"loveandlemons.com",
	"marmiton.org",
	"minimalistbaker.com",
	"pinchofyum.com",
	"recipetineats.com",
	"seriouseats.com",
	"skinnytaste.com",
] as const;
