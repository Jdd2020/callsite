/**
 * @file Collecting results: asks the language servers for the references
 * and definition of the symbol under the cursor, and normalizes them into a
 * UsageModel for the views.
 */
import * as vscode from 'vscode';
import type { UsageModel } from '@/model/types';
import { toLocation, toUsage } from '@/vscode/convert';
import { readLines } from '@/vscode/lineText';

/**
 * Finds every usage of the symbol at `position`.
 *
 * @param {vscode.TextDocument} document - The document holding the symbol.
 * @param {vscode.Position} position - Where the cursor is.
 * @param {vscode.Range} wordRange - The symbol's range at the cursor, from getWordRangeAtPosition.
 * @returns {Promise<UsageModel>} The results, possibly with no usages.
 */
export async function collectUsages(document: vscode.TextDocument, position: vscode.Position, wordRange: vscode.Range): Promise<UsageModel> {
	const [references = [], definitions = []] = await Promise.all([
		vscode.commands.executeCommand<vscode.Location[] | undefined>('vscode.executeReferenceProvider', document.uri, position),
		vscode.commands.executeCommand<(vscode.Location | vscode.LocationLink)[] | undefined>('vscode.executeDefinitionProvider', document.uri, position),
	]);
	// A symbol can have several definitions (merged declarations, a .d.ts
	// and its implementation). The model shows the first; usages at any of
	// them are flagged.
	const definitionLocations = definitions.map(toLocation);
	const lines = await readLines(references);

	return {
		symbol: document.getText(wordRange),
		definition: definitionLocations[0],
		usages: references.map((ref) => toUsage(ref, lines.get(ref.uri.toString())?.get(ref.range.start.line) ?? '', definitionLocations)),
		workspaceRoots: (vscode.workspace.workspaceFolders ?? []).map((folder) => ({ name: folder.name, uri: folder.uri.toString() })),
	};
}
