/**
 * @file The sidebar tree: a TreeDataProvider over the tree from buildTree,
 * with each file's usage lines as its children.
 */
import * as vscode from 'vscode';
import type { RootNode, TreeNode, Usage } from '@/model/types';
import { fileItem, folderItem, rootItem, usageItem } from '@/vscode/treeItems';

/** A usage line under a file. Only the tree needs it, so it isn't a model node. */
interface UsageElement {
	kind: 'usage';
	usage: Usage;
}

/** Anything the tree shows. */
export type Element = RootNode | TreeNode | UsageElement;

/** Shows the current results, or nothing (the view's welcome text) before a search. */
export class UsagesTreeProvider implements vscode.TreeDataProvider<Element> {
	private root: RootNode | undefined;
	private readonly changed = new vscode.EventEmitter<Element | undefined>();
	readonly onDidChangeTreeData = this.changed.event;

	/**
	 * Replaces the results the tree shows.
	 *
	 * @param {RootNode | undefined} root - The new tree, or undefined to clear it.
	 * @returns {void}
	 */
	setRoot(root: RootNode | undefined): void {
		this.root = root;
		this.changed.fire(undefined);
	}

	/**
	 * The children of `element`, or the root when `element` is undefined.
	 *
	 * @param {Element} [element] - The parent, or undefined for the top level.
	 * @returns {Element[]} Its children in display order.
	 */
	getChildren(element?: Element): Element[] {
		if (!element) {
			return this.root ? [this.root] : [];
		}
		switch (element.kind) {
			case 'root':
			case 'folder':
				return element.children;
			case 'file':
				return element.usages.map((usage) => ({ kind: 'usage', usage }));
			case 'usage':
				return [];
		}
	}

	/**
	 * How `element` looks in the tree.
	 *
	 * @param {Element} element - The element to show.
	 * @returns {vscode.TreeItem} Its tree item.
	 */
	getTreeItem(element: Element): vscode.TreeItem {
		switch (element.kind) {
			case 'root':
				return rootItem(element);
			case 'folder':
				return folderItem(element);
			case 'file':
				return fileItem(element);
			case 'usage':
				return usageItem(element.usage);
		}
	}

	/**
	 * Releases the change event.
	 *
	 * @returns {void}
	 */
	dispose(): void {
		this.changed.dispose();
	}
}
