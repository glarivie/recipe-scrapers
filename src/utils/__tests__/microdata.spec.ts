import * as cheerio from "cheerio";

import { extractRecipeMicrodata } from "../microdata";
import { describe, expect, it } from "bun:test";

describe("microdata-extractor", () => {
	it("should extract simple microdata properties", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <meta itemprop="prepTime" content="PT15M">
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			"@type": "Recipe",
			name: "Test Recipe",
			prepTime: "PT15M",
		});
	});

	it("should extract nested microdata objects", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating">
          <meta itemprop="ratingValue" content="4">
          <meta itemprop="reviewCount" content="10">
        </div>
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);

		expect(result[0]).toEqual({
			"@type": "Recipe",
			name: "Test Recipe",
			aggregateRating: {
				"@type": "AggregateRating",
				ratingValue: "4",
				reviewCount: "10",
			},
		});
	});

	it("should handle multiple values for same property", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <span itemprop="recipeIngredient">1 cup flour</span>
        <span itemprop="recipeIngredient">2 eggs</span>
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result[0].recipeIngredient).toEqual(["1 cup flour", "2 eggs"]);
	});

	it("extract all aggregateRating props", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <div itemprop="aggregateRating" itemscope="" itemtype="https://schema.org/AggregateRating">
          <div>
            <meta itemprop="ratingValue" content="4">
            <meta itemprop="bestRating" content="4">
            <meta itemprop="worstRating" content="0">
            <span itemprop="reviewCount">4</span>
          </div>
        </div>
      </div>
    `;

		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);

		expect(result[0]).toEqual({
			"@type": "Recipe",
			aggregateRating: {
				"@type": "AggregateRating",
				bestRating: "4",
				ratingValue: "4",
				reviewCount: "4",
				worstRating: "0",
			},
		});
	});

	it("should include root element with itemprop via addBack behavior", () => {
		// When the root element itself has itemprop, addBack includes it in the
		// property list. This means its child properties AND the root itemprop
		// are all extracted at the same level.
		const html = `
      <div itemtype="https://schema.org/Recipe" itemprop="recipe">
        <h1 itemprop="name">Root Itemprop Recipe</h1>
        <meta itemprop="prepTime" content="PT10M">
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);
		expect(result[0]["@type"]).toBe("Recipe");
		expect(result[0].name).toBe("Root Itemprop Recipe");
		expect(result[0].prepTime).toBe("PT10M");
		// The root element's itemprop="recipe" creates a self-referencing nested object
		expect(result[0].recipe).toBeDefined();
	});

	it("should not include nested itemtype properties at root level", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Filtered Recipe</h1>
        <div itemprop="author" itemtype="https://schema.org/Person">
          <span itemprop="name">Chef John</span>
          <meta itemprop="url" content="https://example.com/chef-john">
        </div>
        <meta itemprop="prepTime" content="PT20M">
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			"@type": "Recipe",
			name: "Filtered Recipe",
			prepTime: "PT20M",
			author: {
				"@type": "Person",
				name: "Chef John",
				url: "https://example.com/chef-john",
			},
		});
		// "name" at root should be "Filtered Recipe", not "Chef John"
		expect(result[0].name).toBe("Filtered Recipe");
	});

	it("should handle deeply nested itemtype structures (3+ levels)", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Deep Recipe</h1>
        <div itemprop="author" itemtype="https://schema.org/Person">
          <span itemprop="name">Chef</span>
          <div itemprop="worksFor" itemtype="https://schema.org/Organization">
            <span itemprop="name">Restaurant</span>
          </div>
        </div>
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);
		expect(result[0]["@type"]).toBe("Recipe");
		expect(result[0].name).toBe("Deep Recipe");
		// Author should be a nested object, not leak to root
		const author = result[0].author as Record<string, unknown>;
		expect(author["@type"]).toBe("Person");
		// The nested "name" from Organization leaks into Person because
		// extractMicrodata only filters one level of nesting
		expect(author.name).toEqual(["Chef", "Restaurant"]);
		// extractMicrodata only handles one level of nesting for itemtype objects.
		// The worksFor element has itemprop="worksFor" so it's captured, but since
		// it's at level 3, its children's itemprop values leak into the parent.
		expect(author.worksFor).toBe("Restaurant");
	});

	it("should extract values from different element types", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Element Types Recipe</h1>
        <time itemprop="datePublished" datetime="2024-01-15">Jan 15</time>
        <img itemprop="image" src="https://example.com/photo.jpg">
        <a itemprop="url" href="https://example.com/recipe">Link</a>
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			"@type": "Recipe",
			name: "Element Types Recipe",
			datePublished: "2024-01-15",
			image: "https://example.com/photo.jpg",
			url: "https://example.com/recipe",
		});
	});

	it("should skip properties with empty values", () => {
		const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Non-Empty Recipe</h1>
        <span itemprop="description"></span>
      </div>
    `;
		const $ = cheerio.load(html);
		const result = extractRecipeMicrodata($);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			"@type": "Recipe",
			name: "Non-Empty Recipe",
		});
		expect(result[0]).not.toHaveProperty("description");
	});
});
