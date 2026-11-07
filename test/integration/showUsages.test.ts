/**
 * @file Integration test for Callsite: Show Usages against the fixture
 * workspace and the built-in TypeScript language server. Compiled to out/
 * by tsc, so it uses relative imports.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import type { FolderNode, RootNode, TreeNode } from '../../src/model/types';

/** Files in the fixture that reference total. */
const EXPECTED_FILES = ['format.ts', 'invoice.ts', 'total.ts'];

suite('Show Usages', () => {
	test('fills the tree for the symbol under the cursor', async function () {
		this.timeout(60_000);
		const folder = vscode.workspace.workspaceFolders?.[0];
		assert.ok(folder, 'the tests must run with test/fixture open');

		const uri = vscode.Uri.joinPath(folder.uri, 'src/components/billing/total.ts');
		const editor = await vscode.window.showTextDocument(uri);
		const offset = editor.document.getText().indexOf('function total') + 'function '.length;
		const position = editor.document.positionAt(offset);
		editor.selection = new vscode.Selection(position, position);
		await waitForReferences(uri, position);

		const root = await vscode.commands.executeCommand<RootNode | undefined>('callsite.showUsages');
		assert.ok(root, 'showUsages returned no tree');
		assert.strictEqual(root.symbol, 'total');
		assert.strictEqual(root.count, 6);

		// src holds two folders, so it stays; components/billing collapses.
		assert.deepStrictEqual(names(root.children), ['src']);
		const src = root.children[0] as FolderNode;
		assert.deepStrictEqual(names(src.children), ['components/billing', 'utils']);
		const billing = src.children[0] as FolderNode;
		assert.strictEqual(billing.count, 4);

		const files = billing.children.filter((c) => c.kind === 'file');
		assert.deepStrictEqual(files.map((f) => [f.name, f.count, f.hasDefinition]), [
			['invoice.ts', 3, false],
			['total.ts', 1, true],
		]);
	});
});

/**
 * Names of `nodes`, in order.
 *
 * @param {TreeNode[]} nodes - Tree nodes.
 * @returns {string[]} Their names.
 */
function names(nodes: TreeNode[]): string[] {
	return nodes.map((n) => n.name);
}

/**
 * Waits for the TypeScript server to load the project: until references
 * at `position` cover every fixture file, or 45 seconds pass.
 *
 * @param {vscode.Uri} uri - The file holding the symbol.
 * @param {vscode.Position} position - The symbol's position.
 * @returns {Promise<void>} Resolves once references are complete.
 */
async function waitForReferences(uri: vscode.Uri, position: vscode.Position): Promise<void> {
	const deadline = Date.now() + 45_000;
	for (;;) {
		const refs = await vscode.commands.executeCommand<vscode.Location[] | undefined>('vscode.executeReferenceProvider', uri, position);
		const found = new Set((refs ?? []).map((r) => r.uri.path.split('/').pop()));
		if (EXPECTED_FILES.every((f) => found.has(f))) {
			return;
		}
		if (Date.now() > deadline) {
			assert.fail(`references never covered the fixture; found ${[...found].join(', ') || 'none'}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}
