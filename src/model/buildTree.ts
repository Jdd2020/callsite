import { type Draft, insertFile, newDraft } from '@/model/tree/draft';
import { finishChildren, finishFolder } from '@/model/tree/finish';
import type { RootNode, TreeNode, Usage, UsageModel } from '@/model/types';

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
 *
 * @param {UsageModel} model - Results for one symbol, as normalized by the glue.
 * @returns {RootNode} The tree, with counts rolled up to every folder and the root.
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
		insertFile(group, path, uri, usages);
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
