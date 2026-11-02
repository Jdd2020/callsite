import type { FileNode, RootNode, TreeNode } from './types';

/** Position in the results. -1 means "nothing selected yet". */
export interface Cursor {
	fileIndex: number;
	usageIndex: number;
}

export const NO_CURSOR: Cursor = { fileIndex: -1, usageIndex: -1 };

/** Files in the order the tree displays them (depth-first). */
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

/** Index of the next file, wrapping from the last to the first. */
export function nextFile(files: FileNode[], fileIndex: number): number | undefined {
	if (files.length === 0) {
		return undefined;
	}
	return fileIndex < 0 ? 0 : (fileIndex + 1) % files.length;
}

/** Index of the previous file, wrapping from the first to the last. */
export function prevFile(files: FileNode[], fileIndex: number): number | undefined {
	if (files.length === 0) {
		return undefined;
	}
	return fileIndex < 0 ? files.length - 1 : (fileIndex - 1 + files.length) % files.length;
}

/** The next usage in the current file, or the first usage of the next file. */
export function nextUsage(files: FileNode[], cursor: Cursor): Cursor | undefined {
	if (files.length === 0) {
		return undefined;
	}
	if (cursor.fileIndex < 0) {
		return { fileIndex: 0, usageIndex: 0 };
	}
	const usageIndex = cursor.usageIndex + 1;
	if (usageIndex < files[cursor.fileIndex].usages.length) {
		return { fileIndex: cursor.fileIndex, usageIndex };
	}
	return { fileIndex: nextFile(files, cursor.fileIndex)!, usageIndex: 0 };
}

/** The previous usage in the current file, or the last usage of the previous file. */
export function prevUsage(files: FileNode[], cursor: Cursor): Cursor | undefined {
	if (files.length === 0) {
		return undefined;
	}
	if (cursor.fileIndex >= 0 && cursor.usageIndex > 0) {
		return { fileIndex: cursor.fileIndex, usageIndex: cursor.usageIndex - 1 };
	}
	const fileIndex = prevFile(files, cursor.fileIndex)!;
	return { fileIndex, usageIndex: files[fileIndex].usages.length - 1 };
}
