/**
 * @file The UsageLabel type: the text of a usage line in the tree and the
 * span to highlight in it.
 */

/** A usage line's label, shaped like vscode.TreeItemLabel. */
export interface UsageLabel {
	/** e.g. 'L42: const total = sum(items);' */
	label: string;
	/** [start, end) character offsets into `label` to highlight; empty when there's nothing to mark. */
	highlights: [number, number][];
}
