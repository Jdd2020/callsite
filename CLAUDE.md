# Callsite

A VS Code extension for exploring every reference to a symbol: a folder tree to navigate usages, Zed-style code excerpts to read them, and an impact map to see what a change would affect.

- **Display name:** Callsite: All Usages in One View
- **Extension ID:** `callsite` (fallback: `callsite-refs`)
- **Repo:** `callsite-vscode`
- **License:** MIT
- **Language:** TypeScript

## Why it exists

VS Code's built-in References View lists files with usage lines under them. Callsite improves on that in stages: a real folder hierarchy with counts and file-by-file stepping (v1), Zed-style multibuffer excerpts (v2), and an impact map showing what a change ripples into (v3). The impact map is the feature neither VS Code nor Zed offers.

References++ by Johannes Rieken (microsoft/vscode-extension-samples, `contentprovider-sample`) is a useful reference implementation for v2's virtual document. Keep its MIT copyright notice if any code is copied.

## Shared foundation

- Command `callsite.showUsages` ("Callsite: Show Usages") runs on the symbol under the cursor.
- Get locations with `vscode.commands.executeCommand('vscode.executeReferenceProvider', uri, position)`. Rely on the installed language servers; do not parse code ourselves.
- Normalize results into a plain model (symbol, definition location, list of usages with file, range, and line text) in a module with no `vscode` import. Every view renders from this model.

## v1: Tree + focus (build this first)

- **Sidebar tree** via `TreeDataProvider` in its own view container:
  - Root node: the symbol name and total usage count.
  - The workspace folder hierarchy, showing only folders and files that contain usages. Each folder shows a rolled-up count; each file shows its count.
  - Collapse single-child folder chains (`src/components/billing` as one node) to keep the tree short.
  - The file holding the definition gets a distinct icon.
  - Optional child nodes per file: each usage line, clickable.
- **Focus in the editor:** selecting a file opens it, scrolls to its first usage, and applies a `TextEditorDecorationType` that highlights every usage in that file, with `overviewRulerColor` so usages show as marks in the scrollbar.
- **Navigation commands with keybindings:**
  - `callsite.nextFile` / `callsite.prevFile` move through files in tree order and show a "File 2 of 7" status bar item.
  - `callsite.nextUsage` / `callsite.prevUsage` move within the current file, then roll over to the next file.
- Clear decorations when the results are dismissed or a new search starts.

## v2: Multibuffer excerpts (A)

- Selecting the root or a folder in the tree opens a read-only virtual document (`TextDocumentContentProvider`, `callsite:` scheme) with every usage in that subtree as an excerpt: file path header, a few lines of context, the usage line highlighted.
- Selecting a single file keeps v1's behavior (the real file, decorated).
- Clicking an excerpt header jumps to the real file and line.
- Set the virtual document's language for syntax highlighting where possible. Fill it incrementally as data arrives.
- Filters: hide tests, hide imports, configurable context lines.

## v3: Impact map (E)

- A "Usages / Impact" toggle. Impact mode shows the definition, then its direct users (the functions or components containing each usage), then what uses those.
- Use `vscode.prepareCallHierarchy` and `vscode.provideIncomingCalls` to walk one or two levels of callers. Cap depth and count to keep it fast.
- Probably a webview (React is fine) because it needs a custom layout. Tests are excluded by default and summarized as a count.
- The tree stays in place; selecting a file highlights it in the map.

## Conventions

- Keep pure logic (building the folder tree, counts, grouping, excerpt formatting, filtering) in modules with no `vscode` import, so it is unit-testable with Vitest.
- Keep VS Code API glue thin.
- Use absolute imports: `@/` for `src/` (`@/model/types`) and `@test/` for `test/` (`@test/unit/factories`), not relative paths. The aliases are defined in `tsconfig.json` `paths` and repeated in `vitest.config.mts` `resolve.alias`; keep them in sync. esbuild reads the tsconfig, but `tsc` doesn't rewrite aliases in its output, so files compiled to `out/` (the integration tests in `test/integration`) must use relative imports.
- Start every `.ts` file in `src/` and `test/` with a block comment before the imports: `/** @file What this file is for. */`. Use block comments for file headers, not `//` line comments.
- Give every function a doc comment with type hints: `@param {Type} name - description` for each parameter and `@returns {Type} description` (including `{void}`). Optional parameters use `[name]`.
- One type per file under `src/model/types/` (e.g. `types/usage.ts`), re-exported from `types/index.ts`; import them from `@/model/types`. Test-only types (factory options, assertion helper types) stay next to the test code that uses them.
- Keep each module to its main exports. Move helper functions out: small shared ones go in `src/model/utils.ts`; a helper big enough to stand on its own (roughly 15+ lines, or a group of functions with their own type) gets its own file, like `src/model/tree/finish.ts`.
- A few integration tests with `@vscode/test-cli` against a small fixture workspace. Language servers need time to warm up before references return.
- Development and testing happen on a personal machine only.

## Dev loop

- `npm run watch`, then F5 to open the Extension Development Host.
- Reload the dev window to pick up changes.
- Package with `vsce package`; publish with `vsce publish`. Also publish to Open VSX with `ovsx`.

## Known limitations

- Results are only as good as the language server. Dynamic Python usages (`getattr`, string references in Django) may be missed.
- Call hierarchy support varies by language server, which limits v3 in some languages.
