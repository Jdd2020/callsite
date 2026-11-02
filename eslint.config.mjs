import typescriptEslint from "typescript-eslint";

export default [{
    files: ["**/*.ts"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint.plugin,
    },

    languageOptions: {
        parser: typescriptEslint.parser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
    },
}, {
    files: ["src/model/**/*.ts"],

    // src/model must stay free of the VS Code API so it can be unit-tested.
    // The typescript-eslint rule also covers `import x = require(...)`;
    // no-restricted-syntax covers plain require() and dynamic import().
    rules: {
        "@typescript-eslint/no-restricted-imports": ["error", {
            paths: [{
                name: "vscode",
                message: "src/model must stay free of the VS Code API so it can be unit-tested.",
            }],
        }],
        "no-restricted-syntax": ["error", {
            selector: "CallExpression[callee.name='require'][arguments.0.value='vscode']",
            message: "src/model must stay free of the VS Code API so it can be unit-tested.",
        }, {
            selector: "ImportExpression[source.value='vscode']",
            message: "src/model must stay free of the VS Code API so it can be unit-tested.",
        }],
    },
}];