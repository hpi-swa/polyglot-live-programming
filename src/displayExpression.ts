import * as vscode from 'vscode';
import { pathToFileURL } from 'url';

interface DisplayExpressionInfo {
    displayString: string;
    error: boolean;
    interopProperties: string[];
    metaQualifiedName: string|undefined;
    metaSimpleName: string|undefined;
    memberNames: string[]|undefined;
    memberDisplayStrings: string[]|undefined;
    elements: string[]|undefined;
}


class ObjectExplorerItem extends vscode.TreeItem {
    children: ObjectExplorerItem[]|undefined;

    constructor(label: string, description: string, children? : ObjectExplorerItem[]) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.description = description;
        this.children = children;
    }
}

let currentObjectInfo: ObjectExplorerItem[] = [ new ObjectExplorerItem('', 'Display an expression first...') ];

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
                vscode.commands.executeCommand('display_expression', pathToFileURL(editor.document.uri.fsPath), selectedText).then((result) => {
                    if (result) {
                        const info = result as DisplayExpressionInfo;
                        const text = info.displayString;
                        const textLines = text.split(/\r\n|\r|\n/);
                        editor.insertSnippet(new vscode.SnippetString(text), selectedRange.end);
                        let endPos;
                        if (textLines.length === 1) {
                            endPos = new vscode.Position(selectedRange.end.line, selectedRange.end.character + text.length);
                        } else {
                            endPos = new vscode.Position(selectedRange.end.line + textLines.length - 1, textLines[textLines.length - 1].length);
                        }
                        editor.selection = new vscode.Selection(selectedRange.end, endPos);
                        if (!info.error) {
                            updateObjectExplorer(info);
                        }
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

let objectExplorerProvider: ObjectExplorerTreeDataProvider|undefined;

function updateObjectExplorer(info: DisplayExpressionInfo) {
    currentObjectInfo = [new ObjectExplorerItem(info.displayString, 'displayString')];
    if (info.metaQualifiedName !== undefined) {
        currentObjectInfo.push(new ObjectExplorerItem(info.metaQualifiedName, 'metaQualifiedName'));
    }
    if (info.metaSimpleName !== undefined) {
        currentObjectInfo.push(new ObjectExplorerItem(info.metaSimpleName, 'metaSimpleName'));
    }

    if (info.interopProperties.length > 0) {
        let interopProperties: ObjectExplorerItem[] = [];
        for (let index = 0; index < info.interopProperties.length; index++) {
            interopProperties.push(new ObjectExplorerItem(info.interopProperties[index], ''));
        }
        currentObjectInfo.push(new ObjectExplorerItem('<Interop Properties>', '', interopProperties));
    }

    if (info.memberNames !== undefined && info.memberNames.length > 0 && info.memberDisplayStrings !== undefined) {
        let members: ObjectExplorerItem[] = [];
        for (let index = 0; index < info.memberNames.length; index++) {
            const memberName = info.memberNames[index];
            const displayString = info.memberDisplayStrings[index];
            if (memberName !== undefined && displayString !== undefined) {
                members.push(new ObjectExplorerItem(memberName, displayString));
            }
        }
        members.sort((a, b) => a.label! > b.label! ? 1 : -1);
        currentObjectInfo.push(new ObjectExplorerItem('<Interop Members>', '', members));
    }
    if (info.elements !== undefined) {
        let elements: ObjectExplorerItem[] = [];
        for (let index = 0; index < info.elements.length; index++) {
            const element = info.elements[index];
            if (element !== undefined) {
                elements.push(new ObjectExplorerItem(element, `#${index}`));
            }
        }
        currentObjectInfo.push(new ObjectExplorerItem('<Interop Elements>', '', elements));
    }
    refreshObjectExplorer();
}

function refreshObjectExplorer() {
    if (objectExplorerProvider === undefined) {
        objectExplorerProvider = new ObjectExplorerTreeDataProvider();
        vscode.window.registerTreeDataProvider('displayExpressionInfo', objectExplorerProvider);
    }
    objectExplorerProvider.refresh();
}

export function initializeDisplayExpression(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.commands.registerCommand('vscode-live-programming.displayExpression', () => {
		displayExpression();
	}));
}

class ObjectExplorerTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: ObjectExplorerItem): ObjectExplorerItem|Thenable<ObjectExplorerItem> {
        return element;
    }

    getChildren(element?: ObjectExplorerItem|undefined): vscode.ProviderResult<ObjectExplorerItem[]> {
        if (element)  {
            return element.children;
        } else {
            return currentObjectInfo;
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ObjectExplorerItem | undefined> = new vscode.EventEmitter<ObjectExplorerItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ObjectExplorerItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}
