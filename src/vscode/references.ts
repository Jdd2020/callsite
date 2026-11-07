/**
 * @file Collecting results: asks the language servers for the references
 * and definition of the symbol under the cursor, and normalizes them into a
 * UsageModel for the views.
 */
import * as vscode from 'vscode';
import { pathSegments } from '@/model/paths';
import type { Location, Usage, UsageModel } from '@/model/types';
import { sameStart } from '@/model/utils';
import { toLocation, toRange } from '@/vscode/convert';

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
	const documents = await openDocuments(references);

	return {
		symbol: document.getText(wordRange),
		definition: definitionLocations[0],
		usages: references.map((ref) => toUsage(ref, documents.get(ref.uri.toString()), definitionLocations)),
		workspaceRoots: (vscode.workspace.workspaceFolders ?? []).map((folder) => ({ name: folder.name, uri: folder.uri.toString() })),
	};
}

/**
 * Opens each file the references point into, in parallel, so their line
 * text can be read. A file that fails to open maps to undefined.
 *
 * @param {vscode.Location[]} references - The reference provider's results.
 * @returns {Promise<Map<string, vscode.TextDocument | undefined>>} Documents by URI string.
 */
async function openDocuments(references: vscode.Location[]): Promise<Map<string, vscode.TextDocument | undefined>> {
	const uris = new Map(references.map((ref) => [ref.uri.toString(), ref.uri]));
	const entries = await Promise.all([...uris].map(async ([key, uri]) => {
		try {
			return [key, await vscode.workspace.openTextDocument(uri)] as const;
		} catch {
			return [key, undefined] as const;
		}
	}));
	return new Map(entries);
}

/**
 * One reference as a model Usage, with its root, path and line text resolved.
 *
 * @param {vscode.Location} ref - The reference.
 * @param {vscode.TextDocument | undefined} document - The file it's in, if it could be opened.
 * @param {Location[]} definitions - Where the symbol is defined.
 * @returns {Usage} The usage.
 */
function toUsage(ref: vscode.Location, document: vscode.TextDocument | undefined, definitions: Location[]): Usage {
	const uri = ref.uri.toString();
	const range = toRange(ref.range);
	const folder = vscode.workspace.getWorkspaceFolder(ref.uri);
	const line = ref.range.start.line;
	return {
		uri,
		range,
		rootIndex: folder?.index,
		path: pathSegments(ref.uri.path, folder?.uri.path),
		lineText: document && line < document.lineCount ? document.lineAt(line).text : '',
		isDefinition: definitions.some((definition) => sameStart(definition, { uri, range })),
	};
}
