// Plain data model that every view renders from. Nothing here may import
// 'vscode', so the logic built on it can be unit-tested without VS Code.
// One type per file; import from '@/model/types'.
export type { Cursor } from '@/model/types/cursor';
export type { Draft } from '@/model/types/draft';
export type { FileNode } from '@/model/types/fileNode';
export type { FolderNode } from '@/model/types/folderNode';
export type { Location } from '@/model/types/location';
export type { Range } from '@/model/types/range';
export type { RootNode } from '@/model/types/rootNode';
export type { TreeNode } from '@/model/types/treeNode';
export type { Usage } from '@/model/types/usage';
export type { UsageModel } from '@/model/types/usageModel';
export type { WorkspaceRoot } from '@/model/types/workspaceRoot';
