/**
 * @file Extension entry point. VS Code calls activate() on first use and
 * deactivate() on shutdown; commands, views and decorations are wired here.
 */
import * as vscode from 'vscode';

/**
 * Called by VS Code the first time a Callsite command or view is used.
 *
 * @param {vscode.ExtensionContext} _context - Holds subscriptions disposed on deactivate.
 * @returns {void}
 */
export function activate(_context: vscode.ExtensionContext): void {}

/**
 * Called by VS Code when the extension shuts down.
 *
 * @returns {void}
 */
export function deactivate(): void {}
