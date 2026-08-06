import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		exclude: ["node_modules", "build"],
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					environment: "node",
					include: [
						"src/test/use-cases/**/*.test.ts",
						"src/test/lib/**/*.test.ts",
					],
				},
			},
			{
				extends: true,
				test: {
					name: "e2e",
					environment: "node",
					include: ["src/test/e2e/**/*.test.ts"],
				},
			},
		],
	},
});
