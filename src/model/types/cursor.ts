/**
 * @file The Cursor type: the current file and usage during navigation.
 */

/**
 * Position in the results. -1 means "nothing selected yet". Cursors are
 * values: the stepping functions return a new one rather than changing it.
 */
export interface Cursor {
	readonly fileIndex: number;
	readonly usageIndex: number;
}
