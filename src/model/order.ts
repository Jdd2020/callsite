/**
 * @file Navigation order: the files in display order, and next/previous
 * file and usage stepping that rolls over between files and wraps at the ends.
 */
import type { Cursor, FileNode, RootNode, TreeNode } from '@/model/types';
import { hasFile } from '@/model/utils';

/** The cursor before anything is selected. Frozen, so it can be shared safely. */
export const NO_CURSOR: Cursor = Object.freeze({ fileIndex: -1, usageIndex: -1 });

/**
 * Files in the order the tree displays them (depth-first).
 *
 * @param {RootNode} root - The tree from buildTree.
 * @returns {FileNode[]} Every file node, in display order.
 */
export function fileOrder(root: RootNode): FileNode[] {
	const files: FileNode[] = [];
	const walk = (nodes: TreeNode[]) => {
		for (const node of nodes) {
			if (node.kind === 'file') {
				files.push(node);
			} else {
				walk(node.children);
			}
		}
	};
	walk(root.children);
	return files;
}

// Cursors can outlive the results they point into (a filter or refresh
// rebuilds the tree with fewer files), so every entry point checks hasFile:
// a file index past the end means "nothing selected", and usage indexes
// are kept in range.

/**
 * Index of the next file, wrapping from the last to the first.
 *
 * @param {FileNode[]} files - Files in display order.
 * @param {number} fileIndex - Current file index, or -1 for none.
 * @returns {number | undefined} The next index, or undefined when there are no files.
 */
export function nextFile(files: FileNode[], fileIndex: number): number | undefined {
	if (files.length === 0) {
		return undefined;
	}
	return hasFile(files, fileIndex) ? (fileIndex + 1) % files.length : 0;
}

/**
 * Index of the previous file, wrapping from the first to the last.
 *
 * @param {FileNode[]} files - Files in display order.
 * @param {number} fileIndex - Current file index, or -1 for none.
 * @returns {number | undefined} The previous index, or undefined when there are no files.
 */
export function prevFile(files: FileNode[], fileIndex: number): number | undefined {
	if (files.length === 0) {
		return undefined;
	}
	return hasFile(files, fileIndex) ? (fileIndex - 1 + files.length) % files.length : files.length - 1;
}

/**
 * The next usage in the current file, or the first usage of the next file.
 *
 * @param {FileNode[]} files - Files in display order.
 * @param {Cursor} cursor - Current position.
 * @returns {Cursor | undefined} The new position, or undefined when there are no files.
 */
export function nextUsage(files: FileNode[], cursor: Cursor): Cursor | undefined {
	if (files.length === 0) {
		return undefined;
	}
	if (!hasFile(files, cursor.fileIndex)) {
		return { fileIndex: 0, usageIndex: 0 };
	}
	const usageIndex = cursor.usageIndex + 1;
	if (usageIndex < files[cursor.fileIndex].usages.length) {
		return { fileIndex: cursor.fileIndex, usageIndex };
	}
	return { fileIndex: nextFile(files, cursor.fileIndex)!, usageIndex: 0 };
}

/**
 * The previous usage in the current file, or the last usage of the previous file.
 *
 * @param {FileNode[]} files - Files in display order.
 * @param {Cursor} cursor - Current position.
 * @returns {Cursor | undefined} The new position, or undefined when there are no files.
 */
export function prevUsage(files: FileNode[], cursor: Cursor): Cursor | undefined {
	if (files.length === 0) {
		return undefined;
	}
	if (hasFile(files, cursor.fileIndex) && cursor.usageIndex > 0) {
		const last = files[cursor.fileIndex].usages.length - 1;
		return { fileIndex: cursor.fileIndex, usageIndex: Math.min(cursor.usageIndex - 1, last) };
	}
	const fileIndex = prevFile(files, cursor.fileIndex)!;
	return { fileIndex, usageIndex: files[fileIndex].usages.length - 1 };
}
