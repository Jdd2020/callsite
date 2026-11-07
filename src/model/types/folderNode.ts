/**
 * @file The FolderNode type: a folder or collapsed folder chain in the tree.
 */
import type { TreeNode } from '@/model/types/treeNode';

/** A folder (or collapsed chain of folders) containing usages. */
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
