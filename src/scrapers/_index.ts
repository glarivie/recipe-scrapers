import type { AbstractScraper } from '@/abstract-scraper'
import { AllRecipes } from './allrecipes'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { BonAppetit } from './bonappetit'
import { BudgetBytes } from './budgetbytes'
import { CookieAndKate } from './cookieandkate'
import { CookPad } from './cookpad'
import { DamnDelicious } from './damndelicious'
import { Delish } from './delish'
import { EatingWell } from './eatingwell'
import { Epicurious } from './epicurious'
import { Food } from './food'
import { Food52 } from './food52'
import { HalfBakedHarvest } from './halfbakedharvest'
import { KingArthur } from './kingarthur'
import { LoveAndLemons } from './loveandlemons'
import { Marmiton } from './marmiton'
import { MinimalistBaker } from './minimalistbaker'
import { NYTimes } from './nytimes'
import { PinchOfYum } from './pinchofyum'
import { RecipeTinEats } from './recipetineats'
import { SallysBakingAddiction } from './sallysbakingaddiction'
import { SeriousEats } from './seriouseats'
import { SimplyRecipes } from './simplyrecipes'
import { SkinnyTaste } from './skinnytaste'
import { Tasty } from './tasty'
import { ThePioneerWoman } from './thepioneerwoman'

/**
 * A map of all scrapers.
 */
export const scrapers = {
  [AllRecipes.host()]: AllRecipes,
  [AmericasTestKitchen.host()]: AmericasTestKitchen,
  [BBCGoodFood.host()]: BBCGoodFood,
  [BonAppetit.host()]: BonAppetit,
  [BudgetBytes.host()]: BudgetBytes,
  [CookPad.host()]: CookPad,
  [CookieAndKate.host()]: CookieAndKate,
  [DamnDelicious.host()]: DamnDelicious,
  [Delish.host()]: Delish,
  [EatingWell.host()]: EatingWell,
  [Epicurious.host()]: Epicurious,
  [Food.host()]: Food,
  [Food52.host()]: Food52,
  [HalfBakedHarvest.host()]: HalfBakedHarvest,
  [KingArthur.host()]: KingArthur,
  [LoveAndLemons.host()]: LoveAndLemons,
  [Marmiton.host()]: Marmiton,
  [MinimalistBaker.host()]: MinimalistBaker,
  [NYTimes.host()]: NYTimes,
  [PinchOfYum.host()]: PinchOfYum,
  [RecipeTinEats.host()]: RecipeTinEats,
  [SallysBakingAddiction.host()]: SallysBakingAddiction,
  [SeriousEats.host()]: SeriousEats,
  [SimplyRecipes.host()]: SimplyRecipes,
  [SkinnyTaste.host()]: SkinnyTaste,
  [Tasty.host()]: Tasty,
  [ThePioneerWoman.host()]: ThePioneerWoman,
} as const satisfies Record<string, typeof AbstractScraper>
