import type { Usage } from '@/model/types';

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
