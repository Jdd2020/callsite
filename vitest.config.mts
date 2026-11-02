import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@test': fileURLToPath(new URL('./test', import.meta.url)),
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		include: ['test/unit/**/*.test.ts'],
		passWithNoTests: true,
	},
});
