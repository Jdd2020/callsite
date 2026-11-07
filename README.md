# callsite

[![CI](https://github.com/Jdd2020/callsite/actions/workflows/ci.yml/badge.svg)](https://github.com/Jdd2020/callsite/actions/workflows/ci.yml)

VSCode extension to easily display all references to an object in an easily digestible manner.

## Development

Requires Node 22+.

```bash
npm install
npm run watch      # rebuild on change
```

Press F5 in VS Code to open an Extension Development Host. Reload that window to pick up changes.

| Script | What it does |
|---|---|
| `npm run compile` | Type-check, lint, and bundle to `dist/` |
| `npm run test:unit` | Vitest unit tests in `test/unit` (pure logic, no VS Code) |
| `npm run test:integration` | Integration tests in `test/integration`, run inside VS Code |
| `npm test` | Both test suites |

### Layout

- `src/model/`: pure logic (tree building, counts, ordering). No `vscode` import, so it can be unit-tested.
- `src/vscode/`: thin glue over the VS Code API.
- `test/fixture/`: a small workspace the integration tests open.
