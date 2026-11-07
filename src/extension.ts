/**
 * @file Extension entry point. VS Code calls activate() on first use and
 * deactivate() on shutdown; commands, views and decorations are wired here.
 */
import * as vscode from 'vscode';
import { createShowUsages } from '@/vscode/showUsages';
import { UsagesTreeProvider } from '@/vscode/treeProvider';

/** What activate() returns as the extension's exports. The integration tests use it to inspect the tree. */
export interface CallsiteApi {
	tree: UsagesTreeProvider;
}

/**
 * Called by VS Code the first time a Callsite command or view is used.
 *
 * @param {vscode.ExtensionContext} context - Holds subscriptions disposed on deactivate.
 * @returns {CallsiteApi} The extension's exports.
 */
export function activate(context: vscode.ExtensionContext): CallsiteApi {
	const tree = new UsagesTreeProvider();
	context.subscriptions.push(
		tree,
		vscode.window.createTreeView('callsite.usages', { treeDataProvider: tree, showCollapseAll: true }),
		vscode.commands.registerCommand('callsite.showUsages', createShowUsages(tree)),
	);
	return { tree };
}

/**
 * Called by VS Code when the extension shuts down.
 *
 * @returns {void}
 */
export function deactivate(): void {}
