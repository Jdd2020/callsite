/**
 * @file Conversions from VS Code's classes to the model's plain objects.
 */
import * as vscode from 'vscode';
import { pathSegments } from '@/model/paths';
import type { Location, Range, Usage } from '@/model/types';
import { sameStart } from '@/model/utils';

/**
 * A vscode.Range as a plain model Range.
 *
 * @param {vscode.Range} range - The VS Code range.
 * @returns {Range} The same span, zero-based.
 */
export function toRange(range: vscode.Range): Range {
	return {
		startLine: range.start.line,
		startChar: range.start.character,
		endLine: range.end.line,
		endChar: range.end.character,
	};
}

/**
 * A model Range as a vscode.Range.
 *
 * @param {Range} range - The model range.
 * @returns {vscode.Range} The same span.
 */
export function fromRange(range: Range): vscode.Range {
	return new vscode.Range(range.startLine, range.startChar, range.endLine, range.endChar);
}

/**
 * A definition result as a plain model Location. Definition providers
 * return either Locations or LocationLinks; for a link, the selection
 * range is the symbol's name rather than its whole declaration.
 *
 * @param {vscode.Location | vscode.LocationLink} result - One definition provider result.
 * @returns {Location} The location of the definition.
 */
export function toLocation(result: vscode.Location | vscode.LocationLink): Location {
	if ('targetUri' in result) {
		return { uri: result.targetUri.toString(), range: toRange(result.targetSelectionRange ?? result.targetRange) };
	}
	return { uri: result.uri.toString(), range: toRange(result.range) };
}

/**
 * One reference as a model Usage, with its root, path and line text resolved.
 *
 * @param {vscode.Location} ref - The reference.
 * @param {string} lineText - Text of the line it starts on ('' if the file couldn't be read).
 * @param {Location[]} definitions - Where the symbol is defined.
 * @returns {Usage} The usage.
 */
export function toUsage(ref: vscode.Location, lineText: string, definitions: Location[]): Usage {
	const uri = ref.uri.toString();
	const range = toRange(ref.range);
	const folder = vscode.workspace.getWorkspaceFolder(ref.uri);
	return {
		uri,
		range,
		rootIndex: folder?.index,
		path: pathSegments(ref.uri.path, folder?.uri.path),
		lineText,
		isDefinition: definitions.some((definition) => sameStart(definition, { uri, range })),
	};
}
