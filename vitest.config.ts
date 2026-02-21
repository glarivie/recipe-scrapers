import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(import.meta.dirname, "./src"),
		},
	},
	test: {
		setupFiles: ["./src/__tests__/setup.ts"],
		coverage: {
			exclude: ["**/*.spec.ts"],
		},
	},
});
