import { AbstractScraper } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'

export class BBCGoodFood extends AbstractScraper {
  static host() {
    return 'bbcgoodfood.com'
  }

  extractors = {
    ingredients: this.ingredients.bind(this),
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const headingSelector = '.recipe__ingredients h3'
    const ingredientSelector = '.recipe__ingredients li'

    if (prevValue && prevValue.length > 0) {
      const values = flattenIngredients(prevValue)

      return groupIngredients(
        this.$,
        values,
        headingSelector,
        ingredientSelector,
      )
    }

    throw new NoIngredientsFoundException()
  }
}
