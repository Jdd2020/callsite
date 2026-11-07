/** A workspace folder that results can belong to. */
export interface WorkspaceRoot {
	name: string;
	/** Result of vscode.Uri.toString() for the workspace folder. */
	uri: string;
}
