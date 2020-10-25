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
import { GraalVMExtension } from './@types/graalvm';

export function activate(context: vscode.ExtensionContext) {
	console.log("Activating Live Programming extension...");

	const graalVMExtension = vscode.extensions.getExtension<GraalVMExtension>('oracle-labs-graalvm.graalvm');
	if (!graalVMExtension) {
		return console.error('Unable to find GraalVM extension.');
	}

	const uriHandler = new UriHandler;
	vscode.window.registerUriHandler(uriHandler);

	initializeObjectInspector();
	initializeDisplayExpression(context);
	initializeBabylonianAnalysis(context, graalVMExtension, uriHandler);
}

export function deactivate() {}
