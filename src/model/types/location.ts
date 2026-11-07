import type { Range } from '@/model/types/range';

/** A range in a file. */
export interface Location {
	/** Result of vscode.Uri.toString(). */
	uri: string;
	range: Range;
}
