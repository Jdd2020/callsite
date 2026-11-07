# Callsite architecture

These docs track how Callsite is put together. Update them in the same PR as any change to the model's shape or to how the tree is built.

| Doc | Covers |
| --- | --- |
| [Data model](data-model.md) | Every type in `src/model/types/`, how they relate, and where each field comes from and goes to |
| [buildTree](build-tree.md) | How `buildTree` turns a `UsageModel` into the sidebar tree, step by step, with a worked example |

## Layers

Callsite is split into a pure model and thin VS Code glue. The model never imports `vscode`; ESLint fails the build if anything under `src/model` tries to (`import`, `import type`, `require()`, `import()` or `import x = require()`). That keeps the logic testable with Vitest, without starting VS Code.

```mermaid
flowchart LR
    subgraph vscode["VS Code"]
        LS["Language servers"]
        UI["Sidebar tree, editor, status bar"]
    end
    subgraph glue["src/vscode (glue)"]
        REF["references.ts"]
        TP["treeProvider.ts<br/>treeItems.ts"]
        NAV["navigation.ts (#5)"]
        DEC["decorations.ts (#4)"]
    end
    subgraph model["src/model (pure, no vscode)"]
        UM[/"UsageModel"/]
        BT["buildTree"]
        RN[/"RootNode"/]
        FO["fileOrder"]
        STEP["nextFile / prevFile<br/>nextUsage / prevUsage"]
    end

    LS -- "executeReferenceProvider<br/>executeDefinitionProvider" --> REF
    REF --> UM --> BT --> RN
    RN --> TP --> UI
    RN --> FO --> STEP
    STEP -- "Cursor" --> NAV --> UI
    NAV --> DEC --> UI
```

## Data flow

1. **Collect** (glue): `callsite.showUsages` calls `collectUsages`, which asks the language servers for references and the definition, reads each file once for line text (from its open document or from disk, without opening it as a document), and resolves each location's workspace root (`getWorkspaceFolder`) and path segments (`pathSegments`). The result is one `UsageModel`.
2. **Build** (model): `buildTree(model)` returns a `RootNode`. See [buildTree](build-tree.md).
3. **Render** (glue): the tree provider hands each node to `treeItems.ts`, which builds its `TreeItem` with labels from `labels.ts`. Usage lines are added under each file by the provider; they aren't model nodes.
4. **Navigate** (model + glue): `fileOrder(root)` flattens the tree into the files in display order. The stepping functions take a `Cursor` and return a new one, and the glue opens, reveals and decorates whatever the cursor points at.

Every later view (v2 excerpts, v3 impact map) also starts from the `UsageModel`, so the model is the one contract between VS Code and the views.

## Source layout

```
src/
  extension.ts       activate: creates the tree view, registers commands, returns { tree } for the tests
  model/
    buildTree.ts     UsageModel -> RootNode
    order.ts         display order, next/prev file and usage, NO_CURSOR
    labels.ts        rootLabel, usageLabel (text and highlight offsets)
    paths.ts         pathSegments: Uri.path -> Usage.path
    utils.ts         compareUsages, compareNames, joinPath, splitPath, hasFile
    tree/
      draft.ts       newDraft, insertFile: the mutable tree buildTree fills in
      finish.ts      finishFolder, finishChildren: Draft -> finished nodes
    types/           one type per file, re-exported from types/index.ts
  vscode/
    showUsages.ts    the callsite.showUsages command: collect, build, show
    references.ts    collectUsages: language server results -> UsageModel
    lineText.ts      readLines: line text for each reference
    convert.ts       vscode.Range / Location <-> model Range / Location
    treeProvider.ts  UsagesTreeProvider (TreeDataProvider)
    treeItems.ts     a TreeItem per node kind
media/
  callsite.svg       activity bar icon
test/
  unit/              Vitest: one test file per model module, plus factories.ts, helpers.ts
  integration/       @vscode/test-cli, runs inside VS Code with test/fixture open
  fixture/           small TypeScript project the integration tests search
```

## Contributions

| Kind | Id | Notes |
| --- | --- | --- |
| Command | `callsite.showUsages` | "Callsite: Show Usages". In the palette when an editor is open, and in the editor context menu when the file has a reference provider. Returns the `RootNode` it showed, which the integration tests use |
| View container | `callsite` | Activity bar, icon `media/callsite.svg` |
| View | `callsite.usages` | The usages tree. Shows welcome text with a Show Usages button until there are results |
| Context key | `callsite.hasResults` | True while the tree shows results; the #5 keybindings will use it |

Only the latest search updates the tree: if an older search finishes after a newer one started, its results are dropped.

## Navigation in brief

`order.ts` works on the flat `FileNode[]` from `fileOrder`, so it never walks the tree itself.

- `nextFile` / `prevFile` take a file index and wrap at the ends.
- `nextUsage` / `prevUsage` take a `Cursor`, move within the file, roll over to the neighbouring file, and wrap at the ends.
- All four return `undefined` when there are no files.
- A cursor can outlive the results it points into (a refresh can leave fewer files). A file index out of range counts as "nothing selected", and usage indexes are clamped to the file's usages.
- `NO_CURSOR` (`{ fileIndex: -1, usageIndex: -1 }`) is frozen and shared. Cursors are never changed in place.
