import type { FileNode, FolderNode, RootNode, TreeNode, Usage, UsageModel } from './types';

const EXTERNAL_KEY = '<external>';

/**
 * Groups usages into the tree the sidebar shows: only folders and files
 * that contain usages, rolled-up counts, single-child folder chains
 * collapsed, folders before files.
 *
 * A single-root workspace shows its folders directly under the root. A
 * multi-root workspace gets one node per workspace folder. Files outside
 * every workspace folder go under an "Other" node, or straight under the
 * root when no workspace is open.
 */
export function buildTree(model: UsageModel): RootNode {
	// Providers sometimes report a location twice (e.g. the declaration from
	// both references and definition), so keep one usage per file and range.
	const byFile = new Map<string, Map<string, Usage>>();
	for (const usage of model.usages) {
		let file = byFile.get(usage.uri);
		if (!file) {
			file = new Map();
			byFile.set(usage.uri, file);
		}
		const { startLine, startChar, endLine, endChar } = usage.range;
		const key = `${startLine}:${startChar}:${endLine}:${endChar}`;
		const seen = file.get(key);
		if (!seen) {
			file.set(key, usage);
		} else if (usage.isDefinition && !seen.isDefinition) {
			file.set(key, { ...seen, isDefinition: true });
		}
	}

	// One draft per workspace root index, plus EXTERNAL_KEY.
	const groups = new Map<number | typeof EXTERNAL_KEY, Draft>();
	for (const [uri, file] of byFile) {
		const usages = [...file.values()];
		const { rootIndex, path } = usages[0];
		const key = rootIndex !== undefined && model.workspaceRoots[rootIndex] ? rootIndex : EXTERNAL_KEY;
		let group = groups.get(key);
		if (!group) {
			group = newDraft();
			groups.set(key, group);
		}
		insert(group, path, uri, usages);
	}

	const definitionUri = model.definition?.uri;
	const children: TreeNode[] = [];
	const used = model.workspaceRoots.flatMap((root, index) => (groups.has(index) ? [{ root, index }] : []));
	if (model.workspaceRoots.length > 1) {
		for (const { root, index } of used) {
			const node = finishFolder(groups.get(index)!, root.name, root.uri, '', definitionUri);
			node.group = 'workspace';
			children.push(node);
		}
	} else if (used.length === 1) {
		children.push(...finishChildren(groups.get(used[0].index)!, used[0].root.uri, '', definitionUri));
	}
	const external = groups.get(EXTERNAL_KEY);
	if (external && model.workspaceRoots.length === 0) {
		// No workspace open: there's nothing to be "other" than.
		children.push(...finishChildren(external, EXTERNAL_KEY, '', definitionUri));
	} else if (external) {
		const node = finishFolder(external, 'Other', EXTERNAL_KEY, '', definitionUri);
		node.group = 'external';
		children.push(node);
	}

	return {
		kind: 'root',
		symbol: model.symbol,
		count: children.reduce((sum, c) => sum + c.count, 0),
		children,
	};
}

interface Draft {
	folders: Map<string, Draft>;
	/** Keyed by URI: two files can share a path (e.g. local and remote copies). */
	files: Map<string, { name: string; usages: Usage[] }>;
}

function newDraft(): Draft {
	return { folders: new Map(), files: new Map() };
}

function insert(group: Draft, path: string[], uri: string, usages: Usage[]): void {
	let dir = group;
	for (const segment of path.slice(0, -1)) {
		let next = dir.folders.get(segment);
		if (!next) {
			next = newDraft();
			dir.folders.set(segment, next);
		}
		dir = next;
	}
	dir.files.set(uri, { name: path[path.length - 1] ?? uri, usages });
}

function finishFolder(draft: Draft, name: string, groupKey: string, path: string, definitionUri: string | undefined): FolderNode {
	const children = finishChildren(draft, groupKey, path, definitionUri);
	return {
		kind: 'folder',
		id: `folder:${groupKey}:${path}`,
		name,
		count: children.reduce((sum, c) => sum + c.count, 0),
		children,
	};
}

function finishChildren(draft: Draft, groupKey: string, path: string, definitionUri: string | undefined): TreeNode[] {
	const folders: FolderNode[] = [];
	for (const [segment, child] of draft.folders) {
		// Collapse single-child folder chains: a folder whose only content is
		// one folder merges with it ('src' + 'components' -> 'src/components').
		let name = segment;
		let childPath = join(path, segment);
		let node = child;
		while (node.files.size === 0 && node.folders.size === 1) {
			const [nextSegment, next] = node.folders.entries().next().value!;
			name = `${name}/${nextSegment}`;
			childPath = join(childPath, nextSegment);
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

function compareUsages(a: Usage, b: Usage): number {
	return a.range.startLine - b.range.startLine || a.range.startChar - b.range.startChar;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function compareNames(a: string, b: string): number {
	return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

function join(path: string, segment: string): string {
	return path ? `${path}/${segment}` : segment;
}
