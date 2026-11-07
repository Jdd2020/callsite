/**
 * @file Integration tests that run inside VS Code (@vscode/test-cli). This
 * file is compiled to out/ by tsc, so it must use relative imports, not the
 * @/ aliases.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension', () => {
	test('loads and activates', async () => {
		const ext = vscode.extensions.all.find((e) => e.packageJSON.name === 'callsite');
		assert.ok(ext, 'callsite extension is not installed in the test host');
		await ext.activate();
		assert.strictEqual(ext.isActive, true);
	});
});
