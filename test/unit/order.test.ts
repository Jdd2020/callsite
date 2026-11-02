import { describe, expect, it } from 'vitest';
import { buildTree } from '../../src/model/buildTree';
import { NO_CURSOR, fileOrder, nextFile, nextUsage, prevFile, prevUsage, type Cursor } from '../../src/model/order';
import { cursorAt as at, model, usage } from './factories';

// Displayed order: src/util/b.ts, src/a.ts, z.ts (folders before files).
const tree = buildTree(model([
	usage('z.ts', 1),
	usage('src/a.ts', 4),
	usage('src/a.ts', 2),
	usage('src/util/b.ts', 7),
	usage('src/util/b.ts', 3),
	usage('src/util/b.ts', 5),
]));
const files = fileOrder(tree);

describe('fileOrder', () => {
	it('lists files depth-first in the order the tree shows them', () => {
		expect(files.map((f) => f.name)).toEqual(['b.ts', 'a.ts', 'z.ts']);
	});

	it('returns no files for an empty tree', () => {
		expect(fileOrder(buildTree(model([])))).toEqual([]);
	});
});

describe('nextFile / prevFile', () => {
	it('starts at the first file going forward and the last going back', () => {
		expect(nextFile(files, -1)).toBe(0);
		expect(prevFile(files, -1)).toBe(2);
	});

	it('steps through files and wraps at both ends', () => {
		expect([0, 1, 2].map((i) => nextFile(files, i))).toEqual([1, 2, 0]);
		expect([0, 1, 2].map((i) => prevFile(files, i))).toEqual([2, 0, 1]);
	});

	it('stays on the only file', () => {
		const one = fileOrder(buildTree(model([usage('a.ts', 1)])));
		expect(nextFile(one, 0)).toBe(0);
		expect(prevFile(one, 0)).toBe(0);
	});

	it('returns undefined when there are no files', () => {
		expect(nextFile([], -1)).toBeUndefined();
		expect(prevFile([], 0)).toBeUndefined();
	});
});

describe('nextUsage', () => {
	it('starts at the first usage of the first file', () => {
		expect(nextUsage(files, NO_CURSOR)).toEqual(at(0, 0));
	});

	it('moves within a file, then rolls over to the next file', () => {
		expect(nextUsage(files, at(0, 0))).toEqual(at(0, 1));
		expect(nextUsage(files, at(0, 2))).toEqual(at(1, 0));
	});

	it('wraps from the last usage to the first', () => {
		expect(nextUsage(files, at(2, 0))).toEqual(at(0, 0));
	});

	it('visits every usage once in a full cycle, in position order', () => {
		const seen: number[] = [];
		let cursor: Cursor = NO_CURSOR;
		for (let i = 0; i < 6; i++) {
			cursor = nextUsage(files, cursor)!;
			seen.push(files[cursor.fileIndex].usages[cursor.usageIndex].range.startLine);
		}
		expect(seen).toEqual([3, 5, 7, 2, 4, 1]);
		expect(nextUsage(files, cursor)).toEqual(at(0, 0));
	});
});

describe('prevUsage', () => {
	it('starts at the last usage of the last file', () => {
		expect(prevUsage(files, NO_CURSOR)).toEqual(at(2, 0));
	});

	it('moves within a file, then rolls back to the last usage of the previous file', () => {
		expect(prevUsage(files, at(0, 2))).toEqual(at(0, 1));
		expect(prevUsage(files, at(1, 0))).toEqual(at(0, 2));
	});

	it('wraps from the first usage to the last', () => {
		expect(prevUsage(files, at(0, 0))).toEqual(at(2, 0));
	});

	it('is the reverse of nextUsage', () => {
		let cursor: Cursor = at(1, 1);
		cursor = nextUsage(files, cursor)!;
		expect(prevUsage(files, cursor)).toEqual(at(1, 1));
	});
});

describe('single file, single usage', () => {
	const one = fileOrder(buildTree(model([usage('a.ts', 1)])));

	it('stays on the only usage in both directions', () => {
		expect(nextUsage(one, at(0, 0))).toEqual(at(0, 0));
		expect(prevUsage(one, at(0, 0))).toEqual(at(0, 0));
	});
});

describe('cursor left over from earlier results', () => {
	it('treats a file index past the end as nothing selected', () => {
		expect(nextFile(files, 6)).toBe(0);
		expect(prevFile(files, 6)).toBe(2);
		expect(nextUsage(files, at(6, 4))).toEqual(at(0, 0));
		expect(prevUsage(files, at(6, 4))).toEqual(at(2, 0));
	});

	it('moves on from a usage index past the end of its file', () => {
		// a.ts (index 1) has 2 usages.
		expect(nextUsage(files, at(1, 9))).toEqual(at(2, 0));
		expect(prevUsage(files, at(1, 9))).toEqual(at(1, 1));
	});
});

describe('NO_CURSOR', () => {
	it('cannot be changed through a shared reference', () => {
		const cursor = NO_CURSOR as { fileIndex: number };
		expect(() => {
			cursor.fileIndex = 2;
		}).toThrow(TypeError);
		expect(NO_CURSOR).toEqual(at(-1, -1));
	});
});

describe('no files', () => {
	it('returns undefined', () => {
		expect(nextUsage([], NO_CURSOR)).toBeUndefined();
		expect(prevUsage([], NO_CURSOR)).toBeUndefined();
	});
});
