import { describe, expect, it } from 'vitest';
import { buildTree } from '../../src/model/buildTree';
import { ROOT, allFiles, findFolder, model, shape, usage } from './helpers';

describe('buildTree', () => {
	it('rolls up counts from files to folders to the root', () => {
		const tree = buildTree(model([
			usage('src/a.ts', 1),
			usage('src/a.ts', 5),
			usage('src/util/b.ts', 2),
			usage('README.md', 0),
		]));

		expect(tree.symbol).toBe('foo');
		expect(tree.count).toBe(4);
		expect(shape(tree)).toEqual([
			['src (3)', [
				['util (1)', ['b.ts (1)']],
				'a.ts (2)',
			]],
			'README.md (1)',
		]);
	});

	it('counts a location reported twice once, keeping the definition flag', () => {
		const tree = buildTree(model([
			usage('def.ts', 1),
			usage('def.ts', 1, { isDefinition: true }),
			usage('def.ts', 1, { char: 8 }),
		]));

		const [file] = allFiles(tree.children);
		expect(tree.count).toBe(2);
		expect(file.usages.map((u) => [u.range.startChar, u.isDefinition])).toEqual([[0, true], [8, false]]);
		expect(file.hasDefinition).toBe(true);
	});

	it('returns an empty root when there are no usages', () => {
		const tree = buildTree(model([]));
		expect(tree.count).toBe(0);
		expect(tree.children).toEqual([]);
	});

	describe('folder chains', () => {
		it('collapses a single-child folder chain into one node', () => {
			const tree = buildTree(model([
				usage('src/components/billing/Invoice.tsx', 3),
				usage('src/components/billing/Total.tsx', 8),
			]));

			expect(shape(tree)).toEqual([
				['src/components/billing (2)', ['Invoice.tsx (1)', 'Total.tsx (1)']],
			]);
		});

		it('stops a chain at a folder that has both files and subfolders', () => {
			const tree = buildTree(model([
				usage('src/app/main.ts', 1),
				usage('src/app/routes/home.ts', 2),
				usage('src/app/routes/deep/er/page.ts', 3),
			]));

			expect(shape(tree)).toEqual([
				['src/app (3)', [
					['routes (2)', [
						['deep/er (1)', ['page.ts (1)']],
						'home.ts (1)',
					]],
					'main.ts (1)',
				]],
			]);
		});

		it('never merges a folder into its only file', () => {
			const tree = buildTree(model([usage('lib/only.ts', 1)]));
			expect(shape(tree)).toEqual([['lib (1)', ['only.ts (1)']]]);
		});

		it('gives collapsed folders unique ids built from the full path', () => {
			const tree = buildTree(model([
				usage('a/b/x.ts', 1),
				usage('a/c/y.ts', 1),
			]));
			const ids = [findFolder(tree.children, 'a'), findFolder(tree.children, 'b'), findFolder(tree.children, 'c')].map((f) => f.id);
			expect(new Set(ids).size).toBe(3);
			expect(findFolder(tree.children, 'b').id).toContain('a/b');
		});
	});

	describe('sorting', () => {
		it('puts folders before files, then sorts by name ignoring case, with numbers in order', () => {
			const tree = buildTree(model([
				usage('file10.ts', 0),
				usage('file2.ts', 0),
				usage('Beta.ts', 0),
				usage('alpha.ts', 0),
				usage('zeta/x.ts', 0),
				usage('Alpha/x.ts', 0),
			]));

			expect(tree.children.map((n) => n.name)).toEqual(['Alpha', 'zeta', 'alpha.ts', 'Beta.ts', 'file2.ts', 'file10.ts']);
		});

		it('sorts usages in a file by line, then character', () => {
			const tree = buildTree(model([
				usage('a.ts', 9),
				usage('a.ts', 2, { char: 10 }),
				usage('a.ts', 2, { char: 4 }),
			]));

			const [file] = allFiles(tree.children);
			expect(file.usages.map((u) => [u.range.startLine, u.range.startChar])).toEqual([[2, 4], [2, 10], [9, 0]]);
		});
	});

	describe('definition', () => {
		it('marks the file that holds model.definition', () => {
			const tree = buildTree(model(
				[usage('def.ts', 1), usage('use.ts', 4)],
				{ definition: { uri: `${ROOT}/def.ts`, range: { startLine: 1, startChar: 0, endLine: 1, endChar: 3 } } },
			));

			const flags = Object.fromEntries(allFiles(tree.children).map((f) => [f.name, f.hasDefinition]));
			expect(flags).toEqual({ 'def.ts': true, 'use.ts': false });
		});

		it('marks a file with a usage flagged isDefinition', () => {
			const tree = buildTree(model([usage('def.ts', 1, { isDefinition: true }), usage('use.ts', 4)]));
			const flags = Object.fromEntries(allFiles(tree.children).map((f) => [f.name, f.hasDefinition]));
			expect(flags).toEqual({ 'def.ts': true, 'use.ts': false });
		});
	});

	describe('workspace roots', () => {
		const api = 'file:///work/api';
		const web = 'file:///work/web';
		const docs = 'file:///work/docs';
		// roots[0] is web, roots[1] is api.
		const roots = [
			{ name: 'web', uri: web },
			{ name: 'api', uri: api },
			{ name: 'docs', uri: docs },
		];

		const inWeb = { root: 0, rootUri: web };
		const inApi = { root: 1, rootUri: api };

		it('shows one node per workspace folder in workspace order, skipping folders with no usages', () => {
			const tree = buildTree(model(
				[usage('server.ts', 1, inApi), usage('src/app.ts', 2, inWeb), usage('src/app.ts', 3, inWeb)],
				{ workspaceRoots: roots },
			));

			expect(shape(tree)).toEqual([
				['web (2)', [['src (2)', ['app.ts (2)']]]],
				['api (1)', ['server.ts (1)']],
			]);
			expect(tree.children.map((n) => n.kind === 'folder' && n.group)).toEqual(['workspace', 'workspace']);
		});

		it("doesn't collapse a workspace folder into its only subfolder", () => {
			const tree = buildTree(model([usage('src/app.ts', 1, inWeb)], { workspaceRoots: roots }));
			expect(shape(tree)).toEqual([['web (1)', [['src (1)', ['app.ts (1)']]]]]);
		});

		it('puts files outside every root under an Other node', () => {
			const tree = buildTree(model([
				usage('src/a.ts', 1),
				usage('/usr/lib/node_modules/pkg/index.d.ts', 7, { root: 'external' }),
			]));

			expect(shape(tree)).toEqual([
				['src (1)', ['a.ts (1)']],
				['Other (1)', [['usr/lib/node_modules/pkg (1)', ['index.d.ts (1)']]]],
			]);
			const other = tree.children[1];
			expect(other.kind === 'folder' && other.group).toBe('external');
		});

		it('treats a root index with no matching workspace folder as external', () => {
			const tree = buildTree(model([usage('a.ts', 1, { root: 5 })]));
			expect(shape(tree)).toEqual([['Other (1)', ['a.ts (1)']]]);
		});

		it('shows paths directly under the root when no workspace is open', () => {
			const tree = buildTree(model(
				[usage('/home/me/scratch/a.ts', 1, { root: 'external' })],
				{ workspaceRoots: [] },
			));
			expect(shape(tree)).toEqual([['home/me/scratch (1)', ['a.ts (1)']]]);
		});

		it('keeps files apart when different URIs share a path', () => {
			const tree = buildTree(model([
				usage('/x/a.ts', 1, { root: 'external', uri: 'file:///x/a.ts' }),
				usage('/x/a.ts', 2, { root: 'external', uri: 'file:///x/a.ts' }),
				usage('/x/a.ts', 3, { root: 'external', uri: 'file:///x/a.ts' }),
				usage('/x/a.ts', 4, { root: 'external', uri: 'vscode-remote://ssh-remote+box/x/a.ts' }),
				usage('/x/a.ts', 5, { root: 'external', uri: 'vscode-remote://ssh-remote+box/x/a.ts' }),
			]));

			expect(tree.count).toBe(5);
			const files = allFiles(tree.children);
			expect(files.map((f) => [f.name, f.count])).toEqual([['a.ts', 3], ['a.ts', 2]]);
			expect(new Set(files.map((f) => f.id)).size).toBe(2);
		});
	});
});
