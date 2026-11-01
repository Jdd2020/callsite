# Callsite

A VS Code extension that shows every reference to a symbol as scrollable code excerpts in a single view, like Zed's multibuffer "Find All References."

- **Display name:** Callsite: All Usages in One View
- **Extension ID:** `callsite` (fallback: `callsite-refs`)
- **Repo:** `callsite-vscode`
- **License:** MIT
- **Language:** TypeScript

## Why it exists

VS Code's Find All References shows a list or a one-at-a-time peek window. Zed opens all references in a multibuffer, a single scrollable view of excerpts. Callsite brings that to VS Code. The closest existing thing is References++ by Johannes Rieken, a sample from microsoft/vscode-extension-samples (`contentprovider-sample`) that is explicitly not product quality. Use it as a reference implementation, and keep its MIT copyright notice if any code is copied.

## Architecture (v1)

- Command `callsite.showUsages` ("Callsite: Show Usages") runs on the symbol under the cursor.
- Get locations with `vscode.commands.executeCommand('vscode.executeReferenceProvider', uri, position)`. Rely on the installed language servers; do not parse code ourselves.
- Render results in a read-only virtual document through a `TextDocumentContentProvider` on a custom URI scheme (`callsite:`).
- Each excerpt: file path header, a few lines of context, the usage line marked. Set the virtual document's language so syntax highlighting works where possible.
- Clicking a header (document link) jumps to the real file and line.
- Fill the document incrementally as references resolve.

## Scope

**v1 (read-only):** show usages command, excerpts with context, jump to source, keybinding.

**v2:** next/previous usage navigation, collapse per file, filter out tests and `node_modules`, group by file or folder, configurable context lines.

**v3 (stretch):** webview split view, or editable excerpts that write back to the real files.

Parked: call hierarchy mode via `vscode.prepareCallHierarchy` / `provideIncomingCalls`.

## Conventions

- Keep pure logic (excerpt formatting, grouping, filtering) in modules with no `vscode` import, so it is unit-testable with Vitest.
- Keep VS Code API glue thin.
- A few integration tests with `@vscode/test-cli` against a small fixture workspace. Language servers need time to warm up before references return.
- Development and testing happen on a personal machine only.

## Dev loop

- `npm run watch`, then F5 to open the Extension Development Host.
- Reload the dev window to pick up changes.
- Package with `vsce package`; publish with `vsce publish`. Also publish to Open VSX with `ovsx`.

## Known limitations

- Results are only as good as the language server. Dynamic Python usages (`getattr`, string references in Django) may be missed.
