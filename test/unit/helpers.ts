/**
 * @file Helpers for inspecting buildTree output. Inputs come from
 * @test/unit/factories.
 */
import { fileOrder } from '@/model/order';
import type { FileNode, FolderNode, RootNode, TreeNode } from '@/model/types';

/** Compact view of a tree for assertions: 'name (count)' with nested children. */
export type Shape = string | [string, Shape[]];

/**
 * A compact view of a tree, for comparing with `toEqual`.
 *
 * @param {RootNode | TreeNode} node - The tree or node to describe.
 * @returns {Shape[] | Shape} The root's children as shapes, or one node's shape.
 */
export function shape(node: RootNode | TreeNode): Shape[] | Shape {
	if (node.kind === 'root') {
		return node.children.map(shape) as Shape[];
	}
	const label = `${node.name} (${node.count})`;
	return node.kind === 'file' ? label : [label, node.children.map(shape) as Shape[]];
}

/**
 * The first folder named `name`, searching depth-first. Throws if there's none.
 *
 * @param {TreeNode[]} nodes - Nodes to search.
 * @param {string} name - Folder label to find, e.g. 'src/components'.
 * @returns {FolderNode} The folder.
 */
export function findFolder(nodes: TreeNode[], name: string): FolderNode {
	const folder = searchFolders(nodes, name);
	if (!folder) {
		throw new Error(`no folder named ${name}`);
	}
	return folder;
}

/**
 * Depth-first search for a folder by label.
 *
 * @param {TreeNode[]} nodes - Nodes to search.
 * @param {string} name - Folder label to find.
 * @returns {FolderNode | undefined} The folder, or undefined if there's none.
 */
function searchFolders(nodes: TreeNode[], name: string): FolderNode | undefined {
	for (const node of nodes) {
		if (node.kind === 'folder') {
			const found = node.name === name ? node : searchFolders(node.children, name);
			if (found) {
				return found;
			}
		}
	}
	return undefined;
}

/**
 * Every file under `nodes`, in display order.
 *
 * @param {TreeNode[]} nodes - Nodes to collect files from.
 * @returns {FileNode[]} The files.
 */
export function allFiles(nodes: TreeNode[]): FileNode[] {
	return fileOrder({ kind: 'root', symbol: '', count: 0, children: nodes });
}
