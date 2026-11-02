// Plain data model that every view renders from. Nothing here may import
// 'vscode', so the logic built on it can be unit-tested without VS Code.

/** Zero-based, like vscode.Range. */
export interface Range {
	startLine: number;
	startChar: number;
	endLine: number;
	endChar: number;
}

export interface Location {
	/** Result of vscode.Uri.toString(). */
	uri: string;
	range: Range;
}

export interface Usage extends Location {
	/**
	 * Index into UsageModel.workspaceRoots of the folder holding this file,
	 * or undefined when it's outside every root. The glue resolves this with
	 * vscode.workspace.getWorkspaceFolder, which handles nesting and path casing.
	 */
	rootIndex?: number;
	/**
	 * Decoded path segments, file name last: relative to the root, or the
	 * whole Uri.path when outside every root. No query or fragment.
	 */
	path: string[];
	/** Full text of the line the usage starts on. */
	lineText: string;
	isDefinition: boolean;
}

export interface WorkspaceRoot {
	name: string;
	/** Result of vscode.Uri.toString() for the workspace folder. */
	uri: string;
}

export interface UsageModel {
	symbol: string;
	definition?: Location;
	usages: Usage[];
	workspaceRoots: WorkspaceRoot[];
}

export interface RootNode {
	kind: 'root';
	symbol: string;
	count: number;
	children: TreeNode[];
}

export interface FolderNode {
	kind: 'folder';
	/** Unique and stable across rebuilds of the same results. */
	id: string;
	/** Display label; collapsed chains are joined with '/', e.g. 'src/components/billing'. */
	name: string;
	/** 'workspace' is a workspace folder in a multi-root workspace; 'external' holds files outside every root. */
	group?: 'workspace' | 'external';
	count: number;
	children: TreeNode[];
}

export interface FileNode {
	kind: 'file';
	id: string;
	name: string;
	uri: string;
	count: number;
	hasDefinition: boolean;
	/** Sorted by position; never empty. */
	usages: Usage[];
}

export type TreeNode = FolderNode | FileNode;
