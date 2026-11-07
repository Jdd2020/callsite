/**
 * @file The callsite.showUsages command: finds the usages of the symbol
 * under the cursor and shows them in the sidebar tree.
 */
import * as vscode from 'vscode';
import { buildTree } from '@/model/buildTree';
import type { RootNode } from '@/model/types';
import { collectUsages } from '@/vscode/references';
import type { UsagesTreeProvider } from '@/vscode/treeProvider';

/**
 * Makes the command handler. Only the latest search updates the tree, so
 * a slow search finishing after a newer one doesn't overwrite its results.
 *
 * @param {UsagesTreeProvider} tree - The tree to fill.
 * @returns {() => Promise<RootNode | undefined>} The handler. It resolves to the tree it showed (used by the integration tests), or undefined when there was nothing to show.
 */
export function createShowUsages(tree: UsagesTreeProvider): () => Promise<RootNode | undefined> {
	let latest = 0;
	return async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			void vscode.window.showInformationMessage('Open a file and put the cursor on a symbol to find its usages.');
			return undefined;
		}

		const search = ++latest;
		await vscode.commands.executeCommand('callsite.usages.focus');
		const model = await vscode.window.withProgress(
			{ location: { viewId: 'callsite.usages' } },
			() => collectUsages(editor.document, editor.selection.active),
		);
		if (search !== latest) {
			return undefined;
		}
		if (!model) {
			void vscode.window.showInformationMessage('Put the cursor on a symbol to find its usages.');
			return undefined;
		}

		const root = model.usages.length > 0 ? buildTree(model) : undefined;
		tree.setRoot(root);
		await vscode.commands.executeCommand('setContext', 'callsite.hasResults', root !== undefined);
		if (!root) {
			void vscode.window.showInformationMessage(`No usages found for '${model.symbol}'.`);
		}
		return root;
	};
}
