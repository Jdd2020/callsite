import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/integration/**/*.test.js',
	// CI sets VSCODE_VERSION to test the oldest supported version too.
	version: process.env.VSCODE_VERSION || 'stable',
});
