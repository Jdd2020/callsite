/**
 * @file Labels for the sidebar tree: the root's summary line and each usage
 * line, kept here so the text and highlight offsets can be unit-tested.
 */
import type { RootNode, Usage, UsageLabel } from '@/model/types';

/**
 * The root node's label, e.g. 'total — 5 usages'.
 *
 * @param {RootNode} root - The tree from buildTree.
 * @returns {string} The symbol and its usage count.
 */
export function rootLabel(root: RootNode): string {
	return `${root.symbol} — ${root.count} ${root.count === 1 ? 'usage' : 'usages'}`;
}

/**
 * A usage line's label: the one-based line number and the trimmed line
 * text, with the usage's own span highlighted when it fits on that line.
 *
 * @param {Usage} usage - The usage to label.
 * @returns {UsageLabel} The label and its highlight.
 */
export function usageLabel(usage: Usage): UsageLabel {
	const prefix = `L${usage.range.startLine + 1}: `;
	const text = usage.lineText.trim();
	const label = prefix + text;
	if (usage.range.endLine !== usage.range.startLine) {
		return { label, highlights: [] };
	}

	// Offsets into lineText shift by the prefix and by what trim() removed.
	const shift = prefix.length - (usage.lineText.length - usage.lineText.trimStart().length);
	const start = Math.max(prefix.length, usage.range.startChar + shift);
	const end = Math.min(label.length, usage.range.endChar + shift);
	return { label, highlights: start < end ? [[start, end]] : [] };
}
