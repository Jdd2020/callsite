/**
 * @file Conversions from VS Code's classes to the model's plain objects.
 */
import * as vscode from 'vscode';
import type { Location, Range } from '@/model/types';

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
