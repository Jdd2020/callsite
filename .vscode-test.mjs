import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/integration/**/*.test.js',
	// CI sets VSCODE_VERSION to test the oldest supported version too. To
	// reproduce that locally: VSCODE_VERSION=1.90.0 npm run test:integration
	version: process.env.VSCODE_VERSION || 'stable',
});
