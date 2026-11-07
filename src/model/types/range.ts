/**
 * @file The Range type: a zero-based span within a file.
 */

/** Zero-based, like vscode.Range. */
export interface Range {
	startLine: number;
	startChar: number;
	endLine: number;
	endChar: number;
}
