/**
 * @file Line text for usages. Each referenced file is read once: from its
 * open document when there is one, otherwise straight from disk. Files are
 * not opened as documents, since that makes language extensions start
 * syncing and analysing every one of them.
 */
import * as vscode from 'vscode';
import { splitLines } from '@/model/utils';

/** How many files to read at once. */
const BATCH_SIZE = 32;

/**
 * The text of every line the references start on, grouped by file. A file
 * that can't be read is left out, so its usages get no line text.
 *
 * @param {vscode.Location[]} references - The reference provider's results.
 * @returns {Promise<Map<string, Map<number, string>>>} Line text by URI string, then by zero-based line.
 */
export async function readLines(references: vscode.Location[]): Promise<Map<string, Map<number, string>>> {
	const wanted = new Map<string, { uri: vscode.Uri; lines: Set<number> }>();
	for (const ref of references) {
		const key = ref.uri.toString();
		const entry = wanted.get(key) ?? { uri: ref.uri, lines: new Set<number>() };
		entry.lines.add(ref.range.start.line);
		wanted.set(key, entry);
	}

	const open = new Map(vscode.workspace.textDocuments.map((doc) => [doc.uri.toString(), doc]));
	const result = new Map<string, Map<number, string>>();
	const files = [...wanted];
	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		await Promise.all(files.slice(i, i + BATCH_SIZE).map(async ([key, { uri, lines }]) => {
			const text = await fileText(uri, open.get(key));
			if (text === undefined) {
				return;
			}
			const all = splitLines(text);
			result.set(key, new Map([...lines].filter((line) => line < all.length).map((line) => [line, all[line]])));
		}));
	}
	return result;
}

/**
 * A file's current text: the open document's (which may have unsaved
 * edits, and is what the references were computed against), or the file
 * on disk decoded as UTF-8.
 *
 * @param {vscode.Uri} uri - The file.
 * @param {vscode.TextDocument | undefined} document - Its open document, if any.
 * @returns {Promise<string | undefined>} The text, or undefined when the file can't be read.
 */
async function fileText(uri: vscode.Uri, document: vscode.TextDocument | undefined): Promise<string | undefined> {
	if (document) {
		return document.getText();
	}
	try {
		return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
	} catch {
		return undefined;
	}
}
