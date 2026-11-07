/**
 * @file Building a folder draft: the mutable tree buildTree fills in before
 * finish.ts turns it into finished nodes.
 */
import type { Draft, Usage } from '@/model/types';

/**
 * An empty folder draft.
 *
 * @returns {Draft} A draft with no folders or files.
 */
export function newDraft(): Draft {
	return { folders: new Map(), files: new Map() };
}

/**
 * Adds a file to a draft, creating the folders on its path as needed.
 *
 * @param {Draft} group - The draft for the file's workspace root (or external group).
 * @param {string[]} path - Decoded path segments, file name last.
 * @param {string} uri - The file's URI, used as its key.
 * @param {Usage[]} usages - The file's usages.
 * @returns {void}
 */
export function insertFile(group: Draft, path: string[], uri: string, usages: Usage[]): void {
	let dir = group;
	for (const segment of path.slice(0, -1)) {
		let next = dir.folders.get(segment);
		if (!next) {
			next = newDraft();
			dir.folders.set(segment, next);
		}
		dir = next;
	}
	dir.files.set(uri, { name: path[path.length - 1] ?? uri, usages });
}
