/**
 * @file Unit tests for the tree labels: the root summary and usage lines
 * with their highlight offsets.
 */
import { describe, expect, it } from 'vitest';
import { buildTree } from '@/model/buildTree';
import { rootLabel, usageLabel } from '@/model/labels';
import { model, usage } from '@test/unit/factories';

describe('rootLabel', () => {
	it('shows the symbol and the usage count', () => {
		expect(rootLabel(buildTree(model([usage('a.ts', 1), usage('b.ts', 2)])))).toBe('foo — 2 usages');
	});

	it('uses the singular for one usage', () => {
		expect(rootLabel(buildTree(model([usage('a.ts', 1)])))).toBe('foo — 1 usage');
	});
});

describe('usageLabel', () => {
	it('shows the one-based line number and highlights the usage', () => {
		// 'foo' at characters 6-9 of 'const foo = 1;'
		const { label, highlights } = usageLabel(usage('a.ts', 41, { char: 6, lineText: 'const foo = 1;' }));
		expect(label).toBe('L42: const foo = 1;');
		expect(highlights).toEqual([[11, 14]]);
		expect(label.slice(11, 14)).toBe('foo');
	});

	it('trims the line and shifts the highlight to match', () => {
		const { label, highlights } = usageLabel(usage('a.ts', 0, { char: 2, lineText: '\t\tfoo();  ' }));
		expect(label).toBe('L1: foo();');
		expect(label.slice(...highlights[0])).toBe('foo');
	});

	it('highlights nothing when the usage spans several lines', () => {
		const u = usage('a.ts', 0, { lineText: 'foo(' });
		const multiline = { ...u, range: { ...u.range, endLine: 2 } };
		expect(usageLabel(multiline).highlights).toEqual([]);
	});

	it('clamps a highlight that runs past the line text', () => {
		const { label, highlights } = usageLabel(usage('a.ts', 0, { char: 1, lineText: 'xfo' }));
		expect(label.slice(...highlights[0])).toBe('fo');
	});
});
