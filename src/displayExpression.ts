/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import { pathToFileURL } from 'url';
import { updateObjectExplorer } from './objectExplorer';
import { ObjectInformation } from './objectExplorerTypes';

function displayExpression() {
    const editor = vscode.window.activeTextEditor;
    if (editor){
        const selection = editor.selection;
        if (selection) {
            let selectedRange: vscode.Range;
            if (selection.start.compareTo(selection.end) === 0) {
                selectedRange = editor.document.lineAt(selection.start.line).range;
            } else {
                selectedRange = selection;
            }
            requestDisplayExpression(editor, selectedRange);
        }
    }
}

function requestDisplayExpression(editor: vscode.TextEditor, selectedRange: vscode.Range): Promise<boolean> {
    const selectedText = editor.document.getText(selectedRange);
    return new Promise<boolean>((resolve) => {
        vscode.commands.getCommands().then((allCommands: string[]) => {
            if (allCommands.includes('display_expression')) {
                const disposable = vscode.window.setStatusBarMessage('Executing expression...');
                vscode.commands.executeCommand('display_expression', pathToFileURL(editor.document.uri.fsPath), selectedText).then((result) => {
                    disposable.dispose();
                    if (result) {
                        const info = result as ObjectInformation;
                        const text = info.error ? info.error : info.displayString;
                        const textLines = text.split(/\r\n|\r|\n/);
                        editor.insertSnippet(new vscode.SnippetString(text), selectedRange.end);
                        let endPos;
                        if (textLines.length === 1) {
                            endPos = new vscode.Position(selectedRange.end.line, selectedRange.end.character + text.length);
                        } else {
                            endPos = new vscode.Position(selectedRange.end.line + textLines.length - 1, textLines[textLines.length - 1].length);
                        }
                        editor.selection = new vscode.Selection(selectedRange.end, endPos);
                        updateObjectExplorer(info);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } else {
                resolve(false);
            }
        });
    });
}

export function initializeDisplayExpression(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.commands.registerCommand('polyglot-live-programming.displayExpression', () => {
		displayExpression();
    }));
}
