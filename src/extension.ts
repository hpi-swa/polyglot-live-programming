import * as vscode from 'vscode';
import { initializeBabylonianAnalysis } from './babylonianAnalysis';
import { initializeDisplayExpression } from './displayExpression';

export function activate(context: vscode.ExtensionContext) {
	console.log("Activating Live Programming extension...");

	initializeDisplayExpression(context);
	initializeBabylonianAnalysis(context);
}

export function deactivate() {}
