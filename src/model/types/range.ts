/** Zero-based, like vscode.Range. */
export interface Range {
	startLine: number;
	startChar: number;
	endLine: number;
	endChar: number;
}
