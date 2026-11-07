/**
 * @file Unit tests for the shared model helpers that aren't covered through
 * buildTree and order.
 */
import { describe, expect, it } from 'vitest';
import { sameStart } from '@/model/utils';
import { location } from '@test/unit/factories';

describe('sameStart', () => {
	it('matches locations in the same file with the same start, whatever their ends', () => {
		const name = location('a.ts', 3, { char: 16 });
		const wider = { ...name, range: { ...name.range, endLine: 9, endChar: 1 } };
		expect(sameStart(name, wider)).toBe(true);
	});

	it('rejects a different start or a different file', () => {
		expect(sameStart(location('a.ts', 3), location('a.ts', 4))).toBe(false);
		expect(sameStart(location('a.ts', 3), location('a.ts', 3, { char: 1 }))).toBe(false);
		expect(sameStart(location('a.ts', 3), location('b.ts', 3))).toBe(false);
	});
});
