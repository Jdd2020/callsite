/**
 * @file Integration test for Callsite: Show Usages against the fixture
 * workspace and the built-in TypeScript language server. Compiled to out/
 * by tsc, so it uses relative imports.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import type { CallsiteApi } from '../../src/extension';
import type { FileNode, FolderNode, RootNode, TreeNode } from '../../src/model/types';

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

		// src holds two folders, so it stays; components/billing collapses.
		assert.deepStrictEqual(names(root.children), ['src']);
		const src = root.children[0] as FolderNode;
		assert.deepStrictEqual(names(src.children), ['components/billing', 'utils']);
		const billing = src.children[0] as FolderNode;
		const utils = src.children[1] as FolderNode;

		const files = billing.children.filter((c) => c.kind === 'file');
		assert.deepStrictEqual(files.map((f) => [f.name, f.hasDefinition]), [
			['invoice.ts', false],
			['total.ts', true],
		]);

		// Every expected usage is present, with its line text: from the open
		// document for total.ts and from disk for the files that aren't open.
		// Counts aren't pinned, because they come from the TypeScript version
		// bundled with VS Code and CI tests against the latest stable.
		assertHasLines(files[0], [
			"import { total } from './total';",
			'return total(lines);',
			'return total(lines) * 0.2;',
		]);
		assertHasLines(utils.children[0] as FileNode, [
			"import { total } from '../components/billing/total';",
			'return `$${total(items)}`;',
		]);
		assertHasLines(files[1], ['export function total(items: number[]): number {']);

		// Clicking a usage line opens its file with the usage selected.
		const ext = vscode.extensions.all.find((e) => e.packageJSON.name === 'callsite');
		const { tree } = ext!.exports as CallsiteApi;
		const invoice = files[0];
		const line = tree.getChildren(invoice)[1];
		const command = tree.getTreeItem(line).command;
		assert.ok(command, 'usage lines should have a click command');
		await vscode.commands.executeCommand(command.command, ...(command.arguments ?? []));

		const opened = vscode.window.activeTextEditor;
		assert.ok(opened, 'clicking a usage line opened no editor');
		assert.strictEqual(opened.document.uri.toString(), invoice.uri);
		const { startLine, startChar, endLine, endChar } = invoice.usages[1].range;
		assert.ok(opened.selection.isEqual(new vscode.Selection(startLine, startChar, endLine, endChar)), 'the usage should be selected');
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
 * Asserts that `file` has a usage on each of the expected lines (compared
 * trimmed). Extra usages are allowed.
 *
 * @param {FileNode} file - A file node.
 * @param {string[]} expected - Trimmed line texts that must each have a usage.
 * @returns {void}
 */
function assertHasLines(file: FileNode, expected: string[]): void {
	const actual = file.usages.map((u) => u.lineText.trim());
	for (const line of expected) {
		assert.ok(actual.includes(line), `${file.name} has no usage on "${line}"; found ${JSON.stringify(actual)}`);
	}
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
