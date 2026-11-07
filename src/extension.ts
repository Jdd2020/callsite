/**
 * @file Extension entry point. VS Code calls activate() on first use and
 * deactivate() on shutdown; commands, views and decorations are wired here.
 */
import * as vscode from 'vscode';
import { createShowUsages } from '@/vscode/showUsages';
import { UsagesTreeProvider } from '@/vscode/treeProvider';

/**
 * Called by VS Code the first time a Callsite command or view is used.
 *
 * @param {vscode.ExtensionContext} context - Holds subscriptions disposed on deactivate.
 * @returns {void}
 */
export function activate(context: vscode.ExtensionContext): void {
	const tree = new UsagesTreeProvider();
	context.subscriptions.push(
		tree,
		vscode.window.createTreeView('callsite.usages', { treeDataProvider: tree, showCollapseAll: true }),
		vscode.commands.registerCommand('callsite.showUsages', createShowUsages(tree)),
	);
}

/**
 * Called by VS Code when the extension shuts down.
 *
 * @returns {void}
 */
export function deactivate(): void {}
