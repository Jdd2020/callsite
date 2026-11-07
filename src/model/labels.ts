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

/** Longest line text a label shows; longer lines (minified code) are clipped around the usage. */
const MAX_TEXT = 200;
/** Characters kept before the usage when a line is clipped. */
const CONTEXT_BEFORE = 40;

/**
 * A usage line's label: the one-based line number and the trimmed line
 * text, with the usage's own span highlighted when it fits on that line.
 * Lines longer than MAX_TEXT are clipped to a window around the usage,
 * with '…' where text was cut, so the highlight stays visible.
 *
 * @param {Usage} usage - The usage to label.
 * @returns {UsageLabel} The label and its highlight.
 */
export function usageLabel(usage: Usage): UsageLabel {
	const { startLine, startChar, endLine, endChar } = usage.range;
	const prefix = `L${startLine + 1}: `;
	const lead = usage.lineText.length - usage.lineText.trimStart().length;
	const text = usage.lineText.trim();

	const from = text.length > MAX_TEXT ? Math.max(0, Math.min(startChar - lead - CONTEXT_BEFORE, text.length - MAX_TEXT)) : 0;
	const shown = text.slice(from, from + MAX_TEXT);
	const before = from > 0 ? '…' : '';
	const after = from + MAX_TEXT < text.length ? '…' : '';
	const label = prefix + before + shown + after;
	if (endLine !== startLine) {
		return { label, highlights: [] };
	}

	// Offsets into lineText shift by the prefix, the leading '…', what
	// trim() removed and what clipping cut off.
	const base = prefix.length + before.length;
	const shift = base - lead - from;
	const start = Math.max(base, startChar + shift);
	const end = Math.min(base + shown.length, endChar + shift);
	return { label, highlights: start < end ? [[start, end]] : [] };
}
