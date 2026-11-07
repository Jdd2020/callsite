/**
 * @file Factories for the model types tests build as input. Each fills in
 * defaults and keeps related fields consistent (a usage's uri, rootIndex and
 * path all describe the same file), so a test only states what it's about.
 * Output types (tree nodes) have no factories: tests read those.
 */
import type { Cursor, Location, Range, Usage, UsageModel, WorkspaceRoot } from '@/model/types';

interface PlaceOpts {
	/** Workspace root index (default 0), or 'external' for a file outside every root. */
	root?: number | 'external';
	/** URI of that root, used to build the URI (default: the default root's). */
	rootUri?: string;
	/** Override the generated URI. */
	uri?: string;
	char?: number;
}

/**
 * A workspace folder named `name`, at file:///work/<name> unless given a URI.
 *
 * @param {string} name - Folder name shown in multi-root trees.
 * @param {string} [uri] - Folder URI (default file:///work/<name>).
 * @returns {WorkspaceRoot} The workspace folder.
 */
export function root(name: string, uri = `file:///work/${name}`): WorkspaceRoot {
	return { name, uri };
}

/** The single workspace folder model() uses unless told otherwise. */
const DEFAULT_ROOT = root('app');

/**
 * A location in `path` (relative to its root, or absolute when external) on `line`.
 *
 * @param {string} path - File path, '/'-separated.
 * @param {number} line - Zero-based line number.
 * @param {PlaceOpts} [opts] - Root, URI override and start character.
 * @returns {Location} The location, with a three-character range.
 */
export function location(path: string, line: number, opts: PlaceOpts = {}): Location {
	const uri = opts.uri ?? (opts.root === 'external' ? `file://${path}` : `${opts.rootUri ?? DEFAULT_ROOT.uri}/${path}`);
	return { uri, range: range(line, opts.char ?? 0) };
}

/**
 * A usage at `path` on `line`, shaped the way the glue produces it.
 *
 * @param {string} path - File path, '/'-separated; becomes the usage's path segments.
 * @param {number} line - Zero-based line number.
 * @param {PlaceOpts & { isDefinition?: boolean }} [opts] - Placement, plus whether it's the definition.
 * @returns {Usage} The usage, with uri, rootIndex and path describing the same file.
 */
export function usage(path: string, line: number, opts: PlaceOpts & { isDefinition?: boolean } = {}): Usage {
	return {
		...location(path, line, opts),
		rootIndex: opts.root === 'external' ? undefined : opts.root ?? 0,
		path: path.split('/').filter((s) => s.length > 0),
		lineText: `line ${line}`,
		isDefinition: opts.isDefinition ?? false,
	};
}

/**
 * Results for symbol 'foo' in a single-root workspace (DEFAULT_ROOT).
 *
 * @param {Usage[]} usages - The usages to include.
 * @param {Partial<UsageModel>} [extra] - Fields to override, e.g. workspaceRoots or definition.
 * @returns {UsageModel} The model.
 */
export function model(usages: Usage[], extra: Partial<UsageModel> = {}): UsageModel {
	return {
		symbol: 'foo',
		usages,
		workspaceRoots: [DEFAULT_ROOT],
		...extra,
	};
}

/**
 * A cursor at the given file and usage.
 *
 * @param {number} fileIndex - File index, or -1 for none.
 * @param {number} usageIndex - Usage index within the file, or -1 for none.
 * @returns {Cursor} The cursor.
 */
export function cursorAt(fileIndex: number, usageIndex: number): Cursor {
	return { fileIndex, usageIndex };
}

/**
 * A three-character range on one line.
 *
 * @param {number} line - Zero-based line number.
 * @param {number} char - Zero-based start character.
 * @returns {Range} The range.
 */
function range(line: number, char: number): Range {
	return { startLine: line, startChar: char, endLine: line, endChar: char + 3 };
}
