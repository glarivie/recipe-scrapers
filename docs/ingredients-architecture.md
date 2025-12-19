# Ingredients Architecture

> **Note**: This document focuses specifically on the ingredients extraction system. For overall project architecture, see [Architecture](./architecture.md).

## Overview

The ingredients extraction system is designed to extract and structure recipe ingredients from various cooking websites. The system uses a multi-layered approach combining generic extraction plugins with site-specific scrapers to produce a consistent data structure.

## Data Structure

### Core Types

```typescript
type IngredientItem = {
  value: string  // The ingredient text, e.g., "1 1/2 cups flour"
}

type IngredientGroup = {
  name: string | null       // Group name, e.g., "For the dough" or null for default
  items: IngredientItem[]   // Array of ingredients in this group
}

type Ingredients = IngredientGroup[]  // Array of groups
```

### Design Decisions

**Why no IDs?**

- Initially had `id` fields on both items and groups
- Removed for simplicity - IDs added complexity without providing value
- Groups and items are identified by their position in arrays

**Why groups?**

- Many recipes organize ingredients into sections (e.g., "For the crust", "For the filling")
- Default group name is `null` for ungrouped ingredients
- Preserves recipe structure and improves readability

## Extraction Flow

### 1. Plugin-Based Extraction

The `RecipeExtractor` runs multiple extraction plugins in priority order:

```txt
1. Schema.org Plugin (priority: 90)
   ├─> Extracts from <script type="application/ld+json">
   └─> Returns: Ingredients with clean, normalized text

2. OpenGraph Plugin (priority: 50)
   └─> Fallback for basic metadata

3. PostProcessor Plugins
   └─> HtmlStripperPlugin: Removes HTML tags from text values
```

**Key Insight**: Schema.org JSON-LD provides **clean, well-formatted text**:

- Proper spacing: `"1 1/2 cups flour"`
- Normalized fractions: `"1/2"` instead of `"½"`
- No HTML artifacts or concatenation issues

### 2. Site-Specific Scrapers

Scrapers extend `AbstractScraper` and can override any field extractor:

```typescript
class NYTimes extends AbstractScraper {
  extractors = {
    ingredients: this.ingredients.bind(this),
  }

  protected ingredients(prevValue: Ingredients | undefined): Ingredients {
    // Custom logic here
  }
}
```

**The `prevValue` Parameter**:

- Contains the result from plugin extraction (usually Schema.org)
- Provides clean text that scrapers can restructure
- Optional - scrapers can extract from scratch if needed

## The Flatten→Regroup Pattern

### Why This Pattern Exists

Many recipe websites have **structure in HTML** but **clean text in JSON-LD**:

**HTML Structure** (NYTimes example):

```html
<h3>For the dough</h3>
<li>1½cups flour</li>          <!-- ❌ No space, unicode fraction -->
<li>½teaspoon salt</li>        <!-- ❌ Concatenated -->

<h3>For the filling</h3>
<li>2cups sugar</li>           <!-- ❌ No space -->
```

**JSON-LD Text** (from Schema.org):

```json
[
  "1 1/2 cups flour",           // ✅ Clean, spaced, normalized
  "1/2 teaspoon salt",          // ✅ Perfect formatting
  "2 cups sugar"                // ✅ No issues
]
```

**The Problem**:

- JSON-LD has **perfect text** but **loses grouping** (all ingredients in flat array)
- HTML has **accurate grouping** but **poor text quality** (no spaces, unicode chars, etc.)

**The Solution**: Use BOTH!

1. Extract clean text from JSON-LD (via Schema.org plugin)
2. Flatten it to strings for matching
3. Parse HTML structure for grouping
4. Match HTML elements to JSON-LD text
5. Rebuild grouped structure with clean text

### Implementation

```typescript
protected ingredients(prevValue: Ingredients | undefined): Ingredients {
  const headingSelector = 'h3.ingredient-group'
  const ingredientSelector = 'li.ingredient'

  if (prevValue && prevValue.length > 0) {
    // Step 1: Flatten prevValue (from Schema.org) to get clean text
    const values = flattenIngredients(prevValue)
    // values = ["1 1/2 cups flour", "1/2 teaspoon salt", "2 cups sugar"]

    // Step 2: Parse HTML and match text to rebuild groups
    return groupIngredients(
      this.$,           // Cheerio instance
      values,           // Clean text from JSON-LD
      headingSelector,  // Where to find group names
      ingredientSelector, // Where to find ingredient items
    )
  }

  throw new NoIngredientsFoundException()
}
```

### Utility Functions

#### `flattenIngredients(ingredients: Ingredients): string[]`

Converts grouped structure to flat array of strings:

```typescript
// Input:
[
  { name: "For the dough", items: [{ value: "1 cup flour" }] },
  { name: "", items: [{ value: "Salt to taste" }] }
]

// Output:
["1 cup flour", "Salt to taste"]
```

**Why flatten?** To get an ordered list of clean text values for matching against HTML elements.

#### `groupIngredients($, values, headingSelector, ingredientSelector): Ingredients`

Rebuilds grouped structure by:

1. Parsing HTML to find headings and items
2. Matching HTML text (normalized) to `values` array (normalized)
3. Creating groups based on HTML structure
4. Using matched text from `values` (preserving clean formatting)

**Normalization**: Both HTML text and values are normalized before matching (trim, lowercase, collapse whitespace) to ensure reliable matches despite formatting differences.

#### `stringsToIngredients(values: string[]): Ingredients`

Converts flat string array to default group structure:

```typescript
// Input:
["1 cup flour", "Salt to taste"]

// Output:
[
  { 
    name: null,  // Default group
    items: [
      { value: "1 cup flour" },
      { value: "Salt to taste" }
    ]
  }
]
```

Used by Schema.org plugin when converting `recipeIngredient` array.

## When to Use Each Approach

### Use Flatten→Regroup When

- ✅ JSON-LD provides clean text but lacks grouping
- ✅ HTML has visible grouping structure (headings, sections)
- ✅ Text quality in HTML is poor (spacing, unicode, concatenation issues)
- **Example**: NYTimes, BBC Good Food, Simply Recipes

### Parse HTML Directly When

- ✅ JSON-LD is missing or unreliable
- ✅ HTML text quality is good
- ✅ Complex custom structure that doesn't fit standard pattern
- **Example**: Sites without proper Schema.org markup

### Use Default (No Override) When

- ✅ Schema.org JSON-LD provides both good text AND grouping
- ✅ No special processing needed
- **Example**: Sites with perfect Schema.org implementation

## Common Pitfalls

### ❌ Don't Parse HTML Text Directly If You Have JSON-LD

```typescript
// BAD: HTML text has formatting issues
protected ingredients(): Ingredients {
  const items = this.$('li.ingredient').map((_, el) => 
    this.$(el).text()  // "1½cups" - no space!
  ).get()
  // ...
}
```

```typescript
// GOOD: Use JSON-LD text with HTML structure
protected ingredients(prevValue: Ingredients | undefined): Ingredients {
  const values = flattenIngredients(prevValue)  // Clean text from JSON-LD
  return groupIngredients(this.$, values, headingSelector, itemSelector)
}
```

### ❌ Don't Modify Text After Flattening

```typescript
// BAD: Modifying clean text
const values = flattenIngredients(prevValue)
  .map(v => v.toUpperCase())  // Don't do this!
```

The text from JSON-LD is already clean and normalized. Preserve it.

### ❌ Don't Flatten If You're Not Regrouping

```typescript
// BAD: Unnecessary work
const values = flattenIngredients(prevValue)
return stringsToIngredients(values)  // Just return prevValue!
```

If Verify test passes with both HTML and JSON-LD extraction

## Future Considerations

### Potential Improvements

1. **Text Normalization Pipeline**: Configurable normalization steps (fraction conversion, unit standardization, etc.)

2. **Fuzzy Matching**: Handle cases where HTML text diverges significantly from JSON-LD (currently uses exact normalized matching)

3. **Fallback Strategies**: Graceful degradation when JSON-LD is partial or HTML structure is ambiguous

4. **Schema.org Validation**: Detect and handle malformed JSON-LD more robustly

5 **Ingredient Parsing**: Breaking "1 cup flour" into quantity/unit/ingredient

### Non-Goals

- **Unit Conversion**: Converting between measurement systems
- **Substitutions**: Handling ingredient alternatives or substitutions
- **Nutritional Analysis**: Calculating nutrition facts from ingredients

## Summary

The ingredients system balances **text quality** (from JSON-LD) with **structural accuracy** (from HTML):

1. **Schema.org Plugin** extracts clean text → `Ingredients` with default grouping
2. **Scrapers** flatten text → parse HTML structure → rebuild groups with clean text
3. **Result**: Accurate grouping with high-quality, normalized ingredient text

This architecture leverages the strengths of both JSON-LD (clean data) and HTML (visual structure) to produce the best possible output.
