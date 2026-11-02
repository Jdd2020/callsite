import type { FileNode, RootNode, TreeNode } from '@/model/types';

/**
 * Position in the results. -1 means "nothing selected yet". Cursors are
 * values: the stepping functions return a new one rather than changing it.
 */
export interface Cursor {
	readonly fileIndex: number;
	readonly usageIndex: number;
}

export const NO_CURSOR: Cursor = Object.freeze({ fileIndex: -1, usageIndex: -1 });

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

// Cursors can outlive the results they point into (a filter or refresh
// rebuilds the tree with fewer files), so every entry point treats a file
// index past the end as "nothing selected" and keeps usage indexes in range.

function hasFile(files: FileNode[], fileIndex: number): boolean {
	return fileIndex >= 0 && fileIndex < files.length;
}

/** Index of the next file, wrapping from the last to the first. */
export function nextFile(files: FileNode[], fileIndex: number): number | undefined {
	if (files.length === 0) {
		return undefined;
	}
	return hasFile(files, fileIndex) ? (fileIndex + 1) % files.length : 0;
}

/** Index of the previous file, wrapping from the first to the last. */
export function prevFile(files: FileNode[], fileIndex: number): number | undefined {
	if (files.length === 0) {
		return undefined;
	}
	return hasFile(files, fileIndex) ? (fileIndex - 1 + files.length) % files.length : files.length - 1;
}

/** The next usage in the current file, or the first usage of the next file. */
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

/** The previous usage in the current file, or the last usage of the previous file. */
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
