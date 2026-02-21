import type { AbstractScraper } from '@/abstract-scraper'
import { AllRecipes } from './allrecipes'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { BonAppetit } from './bonappetit'
import { BudgetBytes } from './budgetbytes'
import { CookPad } from './cookpad'
import { DamnDelicious } from './damndelicious'
import { Delish } from './delish'
import { EatingWell } from './eatingwell'
import { Epicurious } from './epicurious'
import { Food } from './food'
import { Food52 } from './food52'
import { HalfBakedHarvest } from './halfbakedharvest'
import { Marmiton } from './marmiton'
import { NYTimes } from './nytimes'
import { RecipeTinEats } from './recipetineats'
import { SeriousEats } from './seriouseats'
import { SimplyRecipes } from './simplyrecipes'
import { SkinnyTaste } from './skinnytaste'
import { Tasty } from './tasty'

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
  [DamnDelicious.host()]: DamnDelicious,
  [Delish.host()]: Delish,
  [EatingWell.host()]: EatingWell,
  [Epicurious.host()]: Epicurious,
  [Food.host()]: Food,
  [Food52.host()]: Food52,
  [HalfBakedHarvest.host()]: HalfBakedHarvest,
  [Marmiton.host()]: Marmiton,
  [NYTimes.host()]: NYTimes,
  [RecipeTinEats.host()]: RecipeTinEats,
  [SeriousEats.host()]: SeriousEats,
  [SimplyRecipes.host()]: SimplyRecipes,
  [SkinnyTaste.host()]: SkinnyTaste,
  [Tasty.host()]: Tasty,
} as const satisfies Record<string, typeof AbstractScraper>
