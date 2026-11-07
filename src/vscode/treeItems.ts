/**
 * @file Tree items for each kind of node: labels, icons, counts, collapse
 * state and the click command for usage lines.
 */
import * as vscode from 'vscode';
import { rootLabel, usageLabel } from '@/model/labels';
import type { FileNode, FolderNode, RootNode, Usage } from '@/model/types';
import { fromRange } from '@/vscode/convert';

/**
 * The root: the symbol and its usage count, expanded.
 *
 * @param {RootNode} root - The root node.
 * @returns {vscode.TreeItem} Its tree item.
 */
export function rootItem(root: RootNode): vscode.TreeItem {
	const item = new vscode.TreeItem(rootLabel(root), vscode.TreeItemCollapsibleState.Expanded);
	item.id = 'root';
	item.iconPath = new vscode.ThemeIcon('references');
	return item;
}

/**
 * A folder, expanded, with its rolled-up count.
 *
 * @param {FolderNode} folder - The folder node.
 * @returns {vscode.TreeItem} Its tree item.
 */
export function folderItem(folder: FolderNode): vscode.TreeItem {
	const item = new vscode.TreeItem(folder.name, vscode.TreeItemCollapsibleState.Expanded);
	item.id = folder.id;
	item.description = String(folder.count);
	item.iconPath = folder.group === 'workspace'
		? new vscode.ThemeIcon('root-folder')
		: folder.group === 'external'
			? new vscode.ThemeIcon('folder-library')
			: vscode.ThemeIcon.Folder;
	return item;
}

/**
 * A file, collapsed, with its file-type icon and count. The definition's
 * file gets its own icon instead.
 *
 * @param {FileNode} file - The file node.
 * @returns {vscode.TreeItem} Its tree item.
 */
export function fileItem(file: FileNode): vscode.TreeItem {
	const item = new vscode.TreeItem(file.name, vscode.TreeItemCollapsibleState.Collapsed);
	item.id = file.id;
	item.resourceUri = vscode.Uri.parse(file.uri);
	item.description = String(file.count);
	if (file.hasDefinition) {
		item.iconPath = new vscode.ThemeIcon('symbol-method');
		item.description = `${file.count} · definition`;
	}
	return item;
}

/**
 * A usage line that opens its file at the usage when clicked.
 *
 * @param {Usage} usage - The usage.
 * @returns {vscode.TreeItem} Its tree item.
 */
export function usageItem(usage: Usage): vscode.TreeItem {
	const { startLine, startChar, endLine, endChar } = usage.range;
	const item = new vscode.TreeItem(usageLabel(usage), vscode.TreeItemCollapsibleState.None);
	item.id = `usage:${usage.uri}:${startLine}:${startChar}:${endLine}:${endChar}`;
	item.command = {
		title: 'Open Usage',
		command: 'vscode.open',
		arguments: [vscode.Uri.parse(usage.uri), { selection: fromRange(usage.range) } satisfies vscode.TextDocumentShowOptions],
	};
	return item;
}
