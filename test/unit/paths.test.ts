/**
 * @file Unit tests for pathSegments: relative to a root, outside every
 * root, and paths whose casing differs from the root's.
 */
import { describe, expect, it } from 'vitest';
import { pathSegments } from '@/model/paths';

describe('pathSegments', () => {
	it('returns the path relative to the root', () => {
		expect(pathSegments('/work/app/src/a.ts', '/work/app')).toEqual(['src', 'a.ts']);
	});

	it('ignores a trailing slash on the root', () => {
		expect(pathSegments('/work/app/a.ts', '/work/app/')).toEqual(['a.ts']);
	});

	it('drops the root by depth, so a drive letter in different case still matches', () => {
		expect(pathSegments('/C:/work/app/src/a.ts', '/c:/work/app')).toEqual(['src', 'a.ts']);
	});

	it('returns the whole path when the file is outside every root', () => {
		expect(pathSegments('/usr/lib/x/index.d.ts')).toEqual(['usr', 'lib', 'x', 'index.d.ts']);
	});
});
