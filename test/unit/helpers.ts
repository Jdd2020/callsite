import type { FileNode, FolderNode, RootNode, TreeNode, Usage, UsageModel } from '../../src/model/types';

export const ROOT = 'file:///work/app';

/** A usage in `relPath` under ROOT (or an absolute URI) at `line`. */
export function usage(relPath: string, line: number, opts: { char?: number; isDefinition?: boolean; root?: string } = {}): Usage {
	const uri = relPath.includes('://') ? relPath : `${opts.root ?? ROOT}/${relPath}`;
	const char = opts.char ?? 0;
	return {
		uri,
		range: { startLine: line, startChar: char, endLine: line, endChar: char + 3 },
		lineText: `line ${line}`,
		isDefinition: opts.isDefinition ?? false,
	};
}

export function model(usages: Usage[], extra: Partial<UsageModel> = {}): UsageModel {
	return {
		symbol: 'foo',
		usages,
		workspaceRoots: [{ name: 'app', uri: ROOT }],
		...extra,
	};
}

/** Compact view of a tree for assertions: 'name (count)' with nested children. */
export type Shape = string | [string, Shape[]];

export function shape(node: RootNode | TreeNode): Shape[] | Shape {
	if (node.kind === 'root') {
		return node.children.map(shape) as Shape[];
	}
	const label = `${node.name} (${node.count})`;
	return node.kind === 'file' ? label : [label, node.children.map(shape) as Shape[]];
}

export function findFolder(nodes: TreeNode[], name: string): FolderNode {
	for (const node of nodes) {
		if (node.kind === 'folder') {
			if (node.name === name) {
				return node;
			}
			try {
				return findFolder(node.children, name);
			} catch {
				// keep looking
			}
		}
	}
	throw new Error(`no folder named ${name}`);
}

export function allFiles(nodes: TreeNode[]): FileNode[] {
	return nodes.flatMap((n) => (n.kind === 'file' ? [n] : allFiles(n.children)));
}
