import type { Draft, FileNode, FolderNode, TreeNode } from '@/model/types';
import { compareNames, compareUsages, joinPath } from '@/model/utils';

/**
 * Turns a folder draft into a folder node with its count rolled up.
 *
 * @param {Draft} draft - The folder's contents.
 * @param {string} name - Display label (collapsed chains are joined with '/').
 * @param {string} groupKey - Workspace root URI or the external key, used in the id.
 * @param {string} path - Full path of the folder within its group, used in the id.
 * @param {string | undefined} definitionUri - URI of the file holding the definition.
 * @returns {FolderNode} The finished folder node.
 */
export function finishFolder(draft: Draft, name: string, groupKey: string, path: string, definitionUri: string | undefined): FolderNode {
	const children = finishChildren(draft, groupKey, path, definitionUri);
	return {
		kind: 'folder',
		id: `folder:${groupKey}:${path}`,
		name,
		count: children.reduce((sum, c) => sum + c.count, 0),
		children,
	};
}

/**
 * Finishes a draft's children: collapses single-child folder chains, sorts
 * usages by position, and sorts folders before files by name.
 *
 * @param {Draft} draft - The folder whose children to finish.
 * @param {string} groupKey - Workspace root URI or the external key, used in ids.
 * @param {string} path - Path of `draft` within its group ('' at the top).
 * @param {string | undefined} definitionUri - URI of the file holding the definition.
 * @returns {TreeNode[]} Folder nodes followed by file nodes.
 */
export function finishChildren(draft: Draft, groupKey: string, path: string, definitionUri: string | undefined): TreeNode[] {
	const folders: FolderNode[] = [];
	for (const [segment, child] of draft.folders) {
		// Collapse single-child folder chains: a folder whose only content is
		// one folder merges with it ('src' + 'components' -> 'src/components').
		let name = segment;
		let childPath = joinPath(path, segment);
		let node = child;
		while (node.files.size === 0 && node.folders.size === 1) {
			const [nextSegment, next] = node.folders.entries().next().value!;
			name = `${name}/${nextSegment}`;
			childPath = joinPath(childPath, nextSegment);
			node = next;
		}
		folders.push(finishFolder(node, name, groupKey, childPath, definitionUri));
	}

	const files: FileNode[] = [];
	for (const [uri, { name, usages }] of draft.files) {
		const sorted = [...usages].sort(compareUsages);
		files.push({
			kind: 'file',
			id: `file:${uri}`,
			name,
			uri,
			count: sorted.length,
			hasDefinition: uri === definitionUri || sorted.some((u) => u.isDefinition),
			usages: sorted,
		});
	}

	folders.sort((a, b) => compareNames(a.name, b.name));
	files.sort((a, b) => compareNames(a.name, b.name) || compareNames(a.uri, b.uri));
	return [...folders, ...files];
}
