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
