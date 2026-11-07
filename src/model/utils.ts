/**
 * @file Small shared helpers for the model: comparators, location matching,
 * path and line splitting, path joining, and index checks. Helpers big enough to stand alone get their own file.
 */
import type { FileNode, Location, Usage } from '@/model/types';

/**
 * Orders usages by start line, then start character.
 *
 * @param {Usage} a - First usage.
 * @param {Usage} b - Second usage.
 * @returns {number} Negative if `a` comes first, positive if `b` does, 0 if equal.
 */
export function compareUsages(a: Usage, b: Usage): number {
	return a.range.startLine - b.range.startLine || a.range.startChar - b.range.startChar;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Orders names ignoring case, with numbers in numeric order ('file2' before
 * 'file10'). Names equal under that rule fall back to code-unit order, so
 * sorting is stable across runs.
 *
 * @param {string} a - First name.
 * @param {string} b - Second name.
 * @returns {number} Negative if `a` comes first, positive if `b` does, 0 if identical.
 */
export function compareNames(a: string, b: string): number {
	return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

/**
 * Appends a segment to a '/'-separated path.
 *
 * @param {string} path - The path so far ('' for none).
 * @param {string} segment - The segment to append.
 * @returns {string} The joined path.
 */
export function joinPath(path: string, segment: string): string {
	return path ? `${path}/${segment}` : segment;
}

/**
 * Whether two locations are in the same file and start at the same place.
 * Ends are ignored: a definition provider may report the symbol's name or
 * its whole declaration, but both start where a reference to it would.
 *
 * @param {Location} a - First location.
 * @param {Location} b - Second location.
 * @returns {boolean} True if they share a URI and start position.
 */
export function sameStart(a: Location, b: Location): boolean {
	return a.uri === b.uri && a.range.startLine === b.range.startLine && a.range.startChar === b.range.startChar;
}

/**
 * Splits a '/'-separated path into its non-empty segments.
 *
 * @param {string} path - The path, e.g. '/work/app/'.
 * @returns {string[]} The segments, e.g. ['work', 'app'].
 */
export function splitPath(path: string): string[] {
	return path.split('/').filter((s) => s.length > 0);
}

/**
 * Splits text into lines the way VS Code numbers them: '\r\n', '\r' and
 * '\n' all end a line.
 *
 * @param {string} text - The file's text.
 * @returns {string[]} Its lines, without line endings.
 */
export function splitLines(text: string): string[] {
	return text.split(/\r\n|\r|\n/);
}

/**
 * Whether `fileIndex` points at a file in `files`.
 *
 * @param {FileNode[]} files - Files in display order.
 * @param {number} fileIndex - Index to check.
 * @returns {boolean} True if the index is in range.
 */
export function hasFile(files: FileNode[], fileIndex: number): boolean {
	return fileIndex >= 0 && fileIndex < files.length;
}
