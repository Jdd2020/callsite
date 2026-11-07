import type { TreeNode } from '@/model/types/treeNode';

/** Top of the sidebar tree: the symbol and its total usage count. */
export interface RootNode {
	kind: 'root';
	symbol: string;
	count: number;
	children: TreeNode[];
}
