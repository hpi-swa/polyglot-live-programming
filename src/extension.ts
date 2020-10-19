/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import { initializeBabylonianAnalysis, getLastBabylonianResult } from './babylonianAnalysis';
import { initializeDisplayExpression } from './displayExpression';
import { initializeObjectInspector } from './objectExplorer';
import { UriHandler } from './uriHandler';

export function activate(context: vscode.ExtensionContext) {
	console.log("Activating Live Programming extension...");

	const uriHandler = new UriHandler;
	vscode.window.registerUriHandler(uriHandler);

	initializeObjectInspector();
	initializeDisplayExpression(context);
	initializeBabylonianAnalysis(context, uriHandler);
	
}

export function deactivate() {}
