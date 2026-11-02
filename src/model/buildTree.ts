import type { FileNode, FolderNode, RootNode, TreeNode, Usage, UsageModel, WorkspaceRoot } from './types';

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
	const byFile = new Map<string, Usage[]>();
	for (const usage of model.usages) {
		const list = byFile.get(usage.uri);
		if (list) {
			list.push(usage);
		} else {
			byFile.set(usage.uri, [usage]);
		}
	}

	// Group key: a workspace root URI, or EXTERNAL_KEY.
	const groups = new Map<string, Draft>();
	for (const [uri, usages] of byFile) {
		const root = findRoot(uri, model.workspaceRoots);
		const key = root ? trimSlash(root.uri) : EXTERNAL_KEY;
		const segments = root ? pathSegments(uri.slice(key.length)) : pathSegments(stripAuthority(uri));
		let group = groups.get(key);
		if (!group) {
			group = newDraft();
			groups.set(key, group);
		}
		insert(group, segments, uri, usages);
	}

	const definitionUri = model.definition?.uri;
	const children: TreeNode[] = [];
	const workspaceGroups = model.workspaceRoots.filter((r) => groups.has(trimSlash(r.uri)));
	if (model.workspaceRoots.length > 1) {
		for (const root of workspaceGroups) {
			const key = trimSlash(root.uri);
			const node = finishFolder(groups.get(key)!, root.name, key, '', definitionUri);
			node.group = 'workspace';
			children.push(node);
		}
	} else if (workspaceGroups.length === 1) {
		const key = trimSlash(workspaceGroups[0].uri);
		children.push(...finishChildren(groups.get(key)!, key, '', definitionUri));
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
	files: Map<string, { uri: string; usages: Usage[] }>;
}

function newDraft(): Draft {
	return { folders: new Map(), files: new Map() };
}

function insert(group: Draft, segments: string[], uri: string, usages: Usage[]): void {
	let dir = group;
	for (const segment of segments.slice(0, -1)) {
		let next = dir.folders.get(segment);
		if (!next) {
			next = newDraft();
			dir.folders.set(segment, next);
		}
		dir = next;
	}
	dir.files.set(segments[segments.length - 1] ?? uri, { uri, usages });
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
	for (const [name, { uri, usages }] of draft.files) {
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
	files.sort((a, b) => compareNames(a.name, b.name));
	return [...folders, ...files];
}

function findRoot(uri: string, roots: WorkspaceRoot[]): WorkspaceRoot | undefined {
	// Longest match wins, in case one workspace folder is nested in another.
	let best: WorkspaceRoot | undefined;
	for (const root of roots) {
		const prefix = trimSlash(root.uri) + '/';
		if (uri.startsWith(prefix) && (!best || root.uri.length > best.uri.length)) {
			best = root;
		}
	}
	return best;
}

function compareUsages(a: Usage, b: Usage): number {
	return a.range.startLine - b.range.startLine || a.range.startChar - b.range.startChar;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function compareNames(a: string, b: string): number {
	return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

function trimSlash(uri: string): string {
	return uri.endsWith('/') ? uri.slice(0, -1) : uri;
}

/** 'file:///c%3A/x/y.ts' -> '/c%3A/x/y.ts' */
function stripAuthority(uri: string): string {
	return uri.replace(/^[a-z][\w+.-]*:\/\/[^/]*/i, '');
}

function pathSegments(path: string): string[] {
	return path.split('/').filter((s) => s.length > 0).map(decode);
}

function decode(segment: string): string {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

function join(path: string, segment: string): string {
	return path ? `${path}/${segment}` : segment;
}
