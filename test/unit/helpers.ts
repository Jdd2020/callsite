// Helpers for inspecting buildTree output. Inputs come from ./factories.
import { fileOrder } from '@/model/order';
import type { FileNode, FolderNode, RootNode, TreeNode } from '@/model/types';

/** Compact view of a tree for assertions: 'name (count)' with nested children. */
export type Shape = string | [string, Shape[]];

export function shape(node: RootNode | TreeNode): Shape[] | Shape {
	if (node.kind === 'root') {
		return node.children.map(shape) as Shape[];
	}
	const label = `${node.name} (${node.count})`;
	return node.kind === 'file' ? label : [label, node.children.map(shape) as Shape[]];
}

/** The first folder named `name`, searching depth-first. Throws if there's none. */
export function findFolder(nodes: TreeNode[], name: string): FolderNode {
	const folder = searchFolders(nodes, name);
	if (!folder) {
		throw new Error(`no folder named ${name}`);
	}
	return folder;
}

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

/** Every file under `nodes`, in display order. */
export function allFiles(nodes: TreeNode[]): FileNode[] {
	return fileOrder({ kind: 'root', symbol: '', count: 0, children: nodes });
}
