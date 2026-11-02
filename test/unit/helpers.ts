import type { FileNode, FolderNode, RootNode, TreeNode, Usage, UsageModel } from '../../src/model/types';

export const ROOT = 'file:///work/app';

interface UsageOpts {
	char?: number;
	isDefinition?: boolean;
	/** Workspace root index (default 0), or 'external' for a file outside every root. */
	root?: number | 'external';
	/** URI of that root, used to build the usage's URI (default ROOT). */
	rootUri?: string;
	/** Override the generated URI. */
	uri?: string;
}

/**
 * A usage at `path` (relative to its root, or absolute when external) on
 * `line`, shaped the way the glue will produce it.
 */
export function usage(path: string, line: number, opts: UsageOpts = {}): Usage {
	const external = opts.root === 'external';
	const uri = opts.uri ?? (external ? `file://${path}` : `${opts.rootUri ?? ROOT}/${path}`);
	const char = opts.char ?? 0;
	return {
		uri,
		rootIndex: external ? undefined : (opts.root as number | undefined) ?? 0,
		path: path.split('/').filter((s) => s.length > 0),
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
