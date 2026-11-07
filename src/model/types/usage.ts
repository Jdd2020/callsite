/**
 * @file The Usage type: one reference to the symbol, with its workspace
 * root, path and line text as resolved by the glue.
 */
import type { Location } from '@/model/types/location';

/** One reference to the symbol, with what the views need to show it. */
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
