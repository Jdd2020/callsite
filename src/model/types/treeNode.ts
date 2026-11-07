/**
 * @file The TreeNode type: any node below the root (folder or file).
 */
import type { FileNode } from '@/model/types/fileNode';
import type { FolderNode } from '@/model/types/folderNode';

/** Any node below the root. */
export type TreeNode = FolderNode | FileNode;
