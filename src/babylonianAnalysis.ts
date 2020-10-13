'use strict';

import * as vscode from 'vscode';
import { pathToFileURL } from 'url';

let isEnabled = false;

export const PUBLISH_DECORATIONS_REQUEST: string = 'textDocument/publishDecorations';
const PROBE_DECORATION_TYPE = 'PROBE_DECORATION';
const ASSERTION_DECORATION_TYPE = 'ASSERTION_DECORATION';
const EXAMPLE_DECORATION_TYPE = 'EXAMPLE_DECORATION';
const EXAMPLE_PREFIX = '<Example ';

const ACTIVE_DECORATION_TYPES: vscode.TextEditorDecorationType[] = [];

let lastBabylonianRequest: NodeJS.Timeout|null = null;

interface Decoration {
	range: vscode.Range;
	decorationText: string;
}

interface DecorationGroup {
	decorationType: string;
	decorations: Decoration[];
}

interface URI2Decorations {
	uri: string;
    decorationGroups: DecorationGroup[];
}

interface PublishDecorations {
    uri2decorations: URI2Decorations[];
}

function toDecorationType(decorationType: string): vscode.TextEditorDecorationType {
	switch (decorationType) {
		case ASSERTION_DECORATION_TYPE:
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: "white",
					backgroundColor: "#EF6C00",
					margin: "1rem",
				},
			});
		case EXAMPLE_DECORATION_TYPE:
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: "white",
					backgroundColor: "#636360",
					margin: "1rem",
				},
			});
		case PROBE_DECORATION_TYPE:
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: "white",
					backgroundColor: "#4e7ec2",
					margin: "1rem",
				},
			});
		default:
			console.warn('Unknown decoration type:', decorationType);
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: "white",
					backgroundColor: "red",
					margin: "1rem",
				},
			});
	}
}

function toDecorationOptions(decoration: Decoration): vscode.DecorationOptions {
	return {
		range: decoration.range,
		renderOptions: {
			after: {
				contentText: `\u202F${decoration.decorationText}\u202F`,
			},
		},
	};
}

function clearDecorations() {
	while(ACTIVE_DECORATION_TYPES.length > 0) {
		ACTIVE_DECORATION_TYPES.pop()?.dispose();
	}
}

function publishDecorations(response : PublishDecorations) {
	// Clear decorations to allow new updated ones.
	clearDecorations();
	response.uri2decorations.forEach(element => {
		const fileName: string = element.uri.split('file://')[1].replace(/%20/g, ' ');
		const editor = vscode.window.visibleTextEditors.filter(editor => editor.document.fileName === fileName)[0];
		element.decorationGroups.forEach(group => {
			const decorationType = toDecorationType(group.decorationType);
			ACTIVE_DECORATION_TYPES.push(decorationType);
			editor.setDecorations(decorationType, group.decorations.map(toDecorationOptions));
		});
	});
}

export function initializeBabylonianAnalysis(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('vscode-live-programming.toggleBabylonianAnalysis', () => {
		toggleBabylonianAnalysis();
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => scheduleBabylonianAnalysis(event.document)));
	registerSetDecorationHandler();
}

function registerSetDecorationHandler() : void {
	vscode.commands.getCommands().then((commands: string[]) => {
		if (commands.includes('extension.graalvm.registerLSPNotificationHandler')) {
			vscode.commands.executeCommand('extension.graalvm.registerLSPNotificationHandler', PUBLISH_DECORATIONS_REQUEST, publishDecorations).then((result) => {
				if(!result) {
					console.error("Failed to register setDecorations notification handler.");		
				}
			});
		} else {
			console.error("Unable to find GraalVM extension.");
		}
	});
}

function requestBabylonianAnalysis(document: vscode.TextDocument): void {
	clearDecorations();
	vscode.commands.getCommands().then((commands: string[]) => {
		if (commands.includes('babylonian_analysis')) {
			vscode.commands.executeCommand('babylonian_analysis', pathToFileURL(document.uri.fsPath)).then((result) => {
				if (!result) {
					console.warn('Babylonian analysis failed internally');
				}
			});
		}
	});
}

function scheduleBabylonianAnalysis(document: vscode.TextDocument) {
	if (isEnabled && document.getText().includes(EXAMPLE_PREFIX)) {
		if (lastBabylonianRequest) {
			clearTimeout(lastBabylonianRequest);
		}
		lastBabylonianRequest = setTimeout(() => requestBabylonianAnalysis(document), 500);
	}
}

function toggleBabylonianAnalysis() {
	isEnabled = !isEnabled;
	let notification;
	if (isEnabled) {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			requestBabylonianAnalysis(editor.document);
		}
		notification = 'Babylonian Analysis enabled';
	} else {
		clearDecorations();
		notification = 'Babylonian Analysis disabled';
	}
	vscode.window.setStatusBarMessage(notification, 3000);
}
