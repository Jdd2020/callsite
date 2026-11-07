/**
 * @file Path segments for a usage: turns the decoded Uri.path strings the
 * glue reads from VS Code into the segments Usage.path holds.
 */
import { splitPath } from '@/model/utils';

/**
 * A file's path segments, relative to its workspace root when it has one.
 *
 * The glue has already found the root with getWorkspaceFolder, which
 * handles nesting and path casing, so this drops as many leading segments
 * as the root has instead of comparing the strings again.
 *
 * @param {string} filePath - The file's Uri.path, e.g. '/work/app/src/a.ts'.
 * @param {string} [rootPath] - The root folder's Uri.path, or undefined when the file is outside every root.
 * @returns {string[]} Segments with the file name last, e.g. ['src', 'a.ts'].
 */
export function pathSegments(filePath: string, rootPath?: string): string[] {
	const segments = splitPath(filePath);
	return rootPath === undefined ? segments : segments.slice(splitPath(rootPath).length);
}
