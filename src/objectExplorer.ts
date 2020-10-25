/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';

export interface ObjectInformation {
    readonly displayString: string;
    readonly error?: string;
    readonly expression?: string;
    readonly interopProperties: string[];
    readonly metaQualifiedName?: string;
    readonly metaSimpleName?: string;
    readonly memberNames?: string[];
    readonly memberDisplayStrings?: string[];
    readonly elements?: string[];
}

let objectExplorerProvider: ObjectExplorerTreeDataProvider;
let objectExplorerView: vscode.TreeView<ObjectExplorerItem>;

class ObjectExplorerItem extends vscode.TreeItem {
    children: ObjectExplorerItem[]|undefined;

    constructor(label: string, description: string, iconId = '', children? : ObjectExplorerItem[]) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.description = description;
        this.children = children;
        if (iconId.length > 0) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
    }
}

let currentObjectInfo: ObjectExplorerItem[] = [ new ObjectExplorerItem('', 'Display an expression first...', 'info') ];

export function initializeObjectInspector(): void {
    objectExplorerProvider = new ObjectExplorerTreeDataProvider();
    vscode.window.registerTreeDataProvider('objectExplorer', objectExplorerProvider);
    objectExplorerView = vscode.window.createTreeView('objectExplorer', { treeDataProvider: objectExplorerProvider, showCollapseAll: true });
}

export function updateObjectExplorer(info: ObjectInformation) {
    currentObjectInfo = [ new ObjectExplorerItem(info.displayString, 'displayString', 'symbol-string') ];
    if (info.expression) {
        currentObjectInfo.push(new ObjectExplorerItem(info.expression.split('\n').join('\\n'), 'expression', 'code'));
    }
    if (info.error) {
        currentObjectInfo.push(new ObjectExplorerItem(info.error, 'error', 'error'));
    }
    if (info.metaQualifiedName) {
        currentObjectInfo.push(new ObjectExplorerItem(info.metaQualifiedName, 'metaQualifiedName', 'dash'));
    }
    if (info.metaSimpleName) {
        currentObjectInfo.push(new ObjectExplorerItem(info.metaSimpleName, 'metaSimpleName', 'dash'));
    }
    if (info.interopProperties.length > 0) {
        let interopProperties: ObjectExplorerItem[] = [];
        for (let index = 0; index < info.interopProperties.length; index++) {
            interopProperties.push(new ObjectExplorerItem(info.interopProperties[index], ''));
        }
        currentObjectInfo.push(new ObjectExplorerItem(`${interopProperties.length}`, 'interopPropertie(s)', 'symbol-property', interopProperties));
    }
    if (info.memberNames && info.memberDisplayStrings && info.memberNames.length > 0) {
        let members: ObjectExplorerItem[] = [];
        for (let index = 0; index < info.memberNames.length; index++) {
            const memberName = info.memberNames[index];
            const displayString = info.memberDisplayStrings[index];
            if (memberName && displayString) {
                members.push(new ObjectExplorerItem(memberName, displayString));
            }
        }
        members.sort((a, b) => a.label! > b.label! ? 1 : -1);
        currentObjectInfo.push(new ObjectExplorerItem(`${members.length}`, 'interopMember(s)', 'package', members));
    }
    if (info.elements) {
        let elements: ObjectExplorerItem[] = [];
        for (let index = 0; index < info.elements.length; index++) {
            const element = info.elements[index];
            if (element) {
                elements.push(new ObjectExplorerItem(element, `#${index}`));
            }
        }
        currentObjectInfo.push(new ObjectExplorerItem(`${elements.length}`, 'interopElement(s)', 'list-ordered', elements));
    }
    objectExplorerProvider.refresh();
    objectExplorerView.reveal(currentObjectInfo[0], { focus: false, select: false });
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

    getParent(element: ObjectExplorerItem): vscode.ProviderResult<ObjectExplorerItem> {
        return null; /* Always return null, so vscode.TreeView#reveal() can be used. */
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ObjectExplorerItem | undefined> = new vscode.EventEmitter<ObjectExplorerItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ObjectExplorerItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}
