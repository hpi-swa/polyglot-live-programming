/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { pathToFileURL, URLSearchParams } from 'url';
import * as ba from './babylonianAnalysisTypes';
import { DecorationManager } from './babylonianAnalysisDecorations';
import { updateObjectExplorer } from './objectExplorer';
import { ObjectInformation } from './objectExplorerTypes';
import { UriHandler } from './uriHandler';
import * as utils from './utils';
import table from 'markdown-table';
import { GraalVMExtension } from './@types/graalvm';
import { readFileSync } from 'fs';
import { ExtensionContext, window, ViewColumn, Uri } from 'vscode';
import { watch } from 'fs';
import { join } from 'path';
import { environment } from './ng-webview/src/environments/environment';

let isEnabled = false;
let isServerSupportAvailable = false;

export const BABYLONIAN_ANALYSIS_RESULT_METHOD: string = 'textDocument/babylonianAnalysisResult';
const EXAMPLE_PREFIX = '<Example ';
const EMOJIS = ['⏰', '🌈', '🌏', '🌽', '🍄', '🍔', '🍕', '🍙', '🍟', '🍪', '🍰', '🎁', '🎂', '🎉', '🏆', '🏠', '🐟', '🐰', '👑', '👻', '💊', '📣', '💰', '📌', '📦', '📷', '🔑', '🔥', '🔫', '🚀', '🚕', '🚁'];
const EMOJIS_LENGTH = EMOJIS.length;

const ON_CHANGE_TIMEOUT = 1000;

const FAILURE_RESULT = { timeToRunMillis: 0, error: 'No result' } as ba.BabylonianAnalysisTerminationResult;
const DECORATIONS = new DecorationManager;

let lastBabylonianTimeout: NodeJS.Timeout | null = null;
let lastBabylonianResult: ba.BabylonianAnalysisResult;
let lastDidChangeTimeout: NodeJS.Timeout | null = null;
let panel: vscode.WebviewPanel | null = null;
let webviewLine: number = 0;
let webviewIsScrolling: boolean = false;


export function initializeBabylonianAnalysis(context: vscode.ExtensionContext, graalVMExtension: vscode.Extension<GraalVMExtension>, uriHandler: UriHandler) {
	context.subscriptions.push(vscode.commands.registerCommand('polyglot-live-programming.toggleBabylonianAnalysis', () => {
		toggleBabylonianAnalysis(context);
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(handleOnDidChangeTextDocument));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(handleOnDidChangeTextEditorSelection));
	registerBabylonianAnalysisResultHandler(graalVMExtension);
	uriHandler.onPath('/show-probe-details', showProbeDetails);
	uriHandler.onPath('/debug-probe', debugProbe);


	context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges(({ textEditor, visibleRanges }) => {
		if (panel) {
			if (visibleRanges[0].start.line === webviewLine && webviewIsScrolling) {
				webviewIsScrolling = false;
			} else if (!webviewIsScrolling) {
				panel.webview.postMessage({
					type: 'scroll',
					line: visibleRanges,
					source: textEditor.document
				});
			}
		} else {
			vscode.window.showInformationMessage("Panel is null");
		}
	}));
}

export function getLastBabylonianResult() {
	return lastBabylonianResult;
}

function handleBabylonianAnalysisResult(result: ba.BabylonianAnalysisResult, isFinal = false, context?: vscode.ExtensionContext) {
	lastBabylonianResult = result;
	let resultsArray = [];
	DECORATIONS.clearRedundantDecorations(result);
	for (const file of result.files) {
		const editor = vscode.window.visibleTextEditors.filter(editor => editor.document.uri.toString() === file.uri)[0];
		if (editor) {
			for (const probe of file.probes) {
				const decorationType = DECORATIONS.getDecorationType(file.uri, isFinal, probe);
				const decorationOptions = createDecorationOptions(editor, isFinal, file, probe);
				editor.setDecorations(decorationType, [decorationOptions]);
				resultsArray.push(probe);
			}
			if (context) {
				activate(context, resultsArray);
			}
		}
	}
}

// On activation
export function activate(context: ExtensionContext, result: Array<ba.AbstractProbe>) {
	const panel = vscode.window.createWebviewPanel(
		'babylonianResult',
		'Babylonian Result',
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out'), vscode.Uri.joinPath(context.extensionUri, 'out/ng-webview')]
		}
	);

	const index = join(context.extensionPath, 'out', 'ng-webview', 'index.html');

	const matchLinks = /(href|src)="([^"]*)"/g;
	const toUri = (_: any, prefix: 'href' | 'src', link: string) => {
		// For <base href="#" />
		if (link === '#') {
			return `${prefix}="${link}"`;
		}
		// For scripts & links
		const path = join(context.extensionPath, 'out/ng-webview', link);
		const uri = Uri.file(path);
		return `${prefix}="${panel.webview['asWebviewUri'](uri)}"`;
	};

	// Refresh the webview on update from the code
	const updateWebview = async () => {
		const html = readFileSync(index, 'utf-8');
		panel.webview.html = html.replace(matchLinks, toUri);
	};

	if (!environment.production) {
		watch(index).on('change', updateWebview);
	}
	updateWebview();

	context.subscriptions.push(panel);
	sendResultsToWebView(result, panel, context);
}

function sendResultsToWebView(result: Array<ba.AbstractProbe>, panelView: vscode.WebviewPanel, context: ExtensionContext,) {
	const texteditor = vscode.window.activeTextEditor;
	const fileName = texteditor?.document.fileName;
	const lineByLine = require('n-readlines');
	const liner = new lineByLine(fileName);
	let out: string = '';
	let line;
	while (line = liner.next()) {
		out = out.concat(line).concat('\n');
	}
	console.log(out);
	panelView.webview.postMessage({ background: out });
	panelView.webview.postMessage({ result: result });
	panelView.webview.postMessage({ editorConfig: getEditorConfig() });

	panelView.webview.postMessage({
		type: 'scroll',
		line: texteditor?.visibleRanges,
		source: texteditor?.document
	});
	panelView.webview.onDidReceiveMessage(e => {
		onDidScrollWebView(e.line);
	},
		undefined,
		context.subscriptions);
	panel = panelView;
}

function onDidScrollWebView(line: number) {
	const editor = vscode.window.visibleTextEditors;
	if (editor[0]) {
		webviewLine = line;
		const text = editor[0].document.lineAt(line).text;
		webviewIsScrolling = true;
		editor[0].revealRange(
			new vscode.Range(line, 0, line + 1, 0), vscode.TextEditorRevealType.AtTop);
	}
}


function getEditorConfig(): Array<string> {
	const editorConfig = vscode.workspace.getConfiguration('editor');
	const fontFamily: any = editorConfig.get('fontFamily');
	const fontSize: any = editorConfig.get('fontSize');
	return new Array<string>(fontFamily, fontSize);
}

function registerBabylonianAnalysisResultHandler(graalVMExtension: vscode.Extension<GraalVMExtension>): void {
	graalVMExtension.exports.onClientNotification(BABYLONIAN_ANALYSIS_RESULT_METHOD, handleBabylonianAnalysisResult).then((result: boolean) => {
		if (!result) {
			console.error('Failed to register handleBabylonianAnalysisResult notification handler.');
		}
	});
}

function requestBabylonianAnalysis(document: vscode.TextDocument, selectedLine?: number, selectedText?: string, context?: vscode.ExtensionContext): void {
	serverSupportAvailable().then(available => {
		if (available) {
			let disposable = vscode.window.setStatusBarMessage('Performing Babylonian Analysis...');
			console.log('Requesting Babylonian Analysis...');
			console.time('Babylonian Analysis execution');
			const args: Object[] = [document.uri.toString()];
			if (selectedLine && selectedText) {
				args.push(selectedLine);
				args.push(selectedText);
			}
			vscode.commands.executeCommand('babylonian_analysis', ...args).then((resultObject) => {
				const result = resultObject as ba.BabylonianAnalysisTerminationResult || FAILURE_RESULT;
				console.timeEnd('Babylonian Analysis execution');
				console.log(`Time to run on GraalLS backend: ${result.timeToRunMillis}ms`);
				disposable.dispose();
				if (result.error) {
					vscode.window.setStatusBarMessage(`BA failed: ${result.error}`, 1000);
				} else if (result.result) {
					if (context) {
						handleBabylonianAnalysisResult(result.result, true, context);
					} else {
						handleBabylonianAnalysisResult(result.result, true);
					}
				}
			});
		} else {
			vscode.window.setStatusBarMessage('Babylonian Analysis not supported by language server.', 3000);
			utils.suggestToInstallLiveComponent();
		}
	});
}

async function serverSupportAvailable(): Promise<boolean> {
	if (isServerSupportAvailable) {
		return true;
	} else {
		return isServerSupportAvailable = (await vscode.commands.getCommands()).includes('babylonian_analysis');
	}
}

function handleOnDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
	const document = event.document;
	if (isEnabled && containsExemplifiedCode(document)) {
		if (lastBabylonianTimeout) {
			clearTimeout(lastBabylonianTimeout);
		}
		lastBabylonianTimeout = setTimeout(() => requestBabylonianAnalysis(document), ON_CHANGE_TIMEOUT);
	}
}

function handleOnDidChangeTextEditorSelection(event: vscode.TextEditorSelectionChangeEvent) {
	const document = event.textEditor.document;
	if (isEnabled && containsExemplifiedCode(document) && event.selections.length === 1) {
		const selection = event.selections[0];
		if (!selection.isEmpty) {
			const selectedText = document.getText(selection);
			if (event.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
				requestBabylonianAnalysis(document, selection.start.line, selectedText);
			} else {
				if (lastDidChangeTimeout) {
					clearTimeout(lastDidChangeTimeout);
				}
				lastDidChangeTimeout = setTimeout(() => requestBabylonianAnalysis(document, selection.start.line, selectedText), 2 * ON_CHANGE_TIMEOUT);
			}
		}
	}
}

function toggleBabylonianAnalysis(context: vscode.ExtensionContext) {
	isEnabled = !isEnabled;
	let notification;
	if (isEnabled) {
		const editor = vscode.window.activeTextEditor;
		if (editor && containsExemplifiedCode(editor.document)) {
			requestBabylonianAnalysis(editor.document, undefined, undefined, context);
		}
		notification = 'Babylonian Analysis enabled';
	} else {
		DECORATIONS.clearAllDecorations();
		notification = 'Babylonian Analysis disabled';
	}
	vscode.window.setStatusBarMessage(notification, 3000);
}

function joinDisplayStrings(values: ObjectInformation[]): string {
	const strings: string[] = [];
	for (const value of values) {
		strings.push(value.displayString);
	}
	return strings.join('\u2794');
}

function createDecorationText(isFinalResult: boolean, probe: ba.AbstractProbe): string {
	if (probe.examples.length === 0) {
		return isFinalResult ? '<not reached>' : 'pending\u2026';
	}
	const probeTexts: string[] = [];
	for (const example of probe.examples) {
		probeTexts.push(`${toEmoticon(example.exampleName)} ${truncate(joinDisplayStrings(example.observedValues), 50)}`);
	}
	return probeTexts.join(' ');
}

function createHoverMessage(fileResult: ba.BabylonianAnalysisFileResult, probe: ba.AbstractProbe): vscode.MarkdownString {
	const maxNumberOfObservedValues = getMaxNumberOfObservedValues(probe.examples);
	let tableData: string[][];
	if (maxNumberOfObservedValues > 1) {
		tableData = [['']];
		for (let index = 1; index <= maxNumberOfObservedValues; index++) {
			tableData.push([`${index}.`]);
		}
		for (const example of probe.examples) {
			pushProbeWithMultipleObservedValues(tableData, fileResult, probe.lineIndex, example, maxNumberOfObservedValues);
		}
	} else {
		tableData = [[''], ['displayString'], ['metaName'], [''], ['properties'], ['member(s)'], ['element(s)']];
		for (const example of probe.examples) {
			pushProbeWithSingleObservedValue(tableData, fileResult, probe.lineIndex, example);
		}
	}
	return new vscode.MarkdownString(`${table(tableData, { align: 'c' })}`, true);
}

function getMaxNumberOfObservedValues(results: ba.ExampleResult[]): number {
	let maxLength = 1;
	for (const result of results) {
		maxLength = Math.max(maxLength, result.observedValues.length);
	}
	return maxLength;
}

function pushProbeWithSingleObservedValue(tableData: string[][], fileResult: ba.BabylonianAnalysisFileResult, lineIndex: number, example: ba.ExampleResult) {
	const observedValue = example.observedValues[example.observedValues.length - 1];
	tableData[0].push(`[${toEmoticon(example.exampleName)} ${truncate(prettifyExampleName(example.exampleName), 20)}](${createProbeInspectionUrl(fileResult, lineIndex, example.exampleName, 0)})${createDebugSuffix(fileResult, lineIndex, example)}`);
	tableData[1].push(observedValue.error ? truncate(observedValue.error, 20) : toRichMarkdown(observedValue.displayString, 20));
	tableData[2].push(observedValue.metaSimpleName || '-');
	tableData[3].push('');
	tableData[4].push(observedValue.interopProperties.map(s => `*${s}*`).join(', ') || '-');
	tableData[5].push(`${(observedValue.memberNames || []).length}`);
	tableData[6].push(`${(observedValue.elements || []).length}`);
}

function pushProbeWithMultipleObservedValues(tableData: string[][], fileResult: ba.BabylonianAnalysisFileResult, lineIndex: number, example: ba.ExampleResult, maxNumberOfObservedValues: number) {
	tableData[0].push(`${toEmoticon(example.exampleName)} ${truncate(prettifyExampleName(example.exampleName), 20)}${createDebugSuffix(fileResult, lineIndex, example)}`);
	const numberOfObservedValues = example.observedValues.length;
	for (let index = 0; index < maxNumberOfObservedValues; index++) {
		let result;
		if (index < numberOfObservedValues) {
			const value = example.observedValues[index];
			result = `[${truncate(value.error ? value.error : value.displayString, 20)}](${createProbeInspectionUrl(fileResult, lineIndex, example.exampleName, index)})`;
		} else {
			result = '';
		}
		tableData[1 + index].push(result);
	}
}

function createDecorationOptions(editor: vscode.TextEditor, isFinalResult: boolean, file: ba.BabylonianAnalysisFileResult, probe: ba.AbstractProbe): vscode.DecorationOptions {
	return {
		hoverMessage: probe.examples.length === 0 ? [] : [
			'### Babylonian Analysis',
			createHoverMessage(file, probe),
		],
		range: editor.document.lineAt(probe.lineIndex).range,
		renderOptions: {
			after: {
				contentText: `\u202F${createDecorationText(isFinalResult, probe)}\u202F`,
				fontStyle: isFinalResult && probe.examples.length === 0 ? 'italic' : undefined,
			},
		},
	};
}

function createProbeInspectionUrl(fileResult: ba.BabylonianAnalysisFileResult, lineIndex: number, exampleName: string, observedValueIndex: number) {
	return `vscode://hpi-swa.polyglot-live-programming/show-probe-details?fileUri=${encodeURIComponent(fileResult.uri)}&lineIndex=${lineIndex}&exampleName=${encodeURIComponent(exampleName)}&observedValueIndex=${observedValueIndex}`;
}

function createProbeDebugUrl(fileResult: ba.BabylonianAnalysisFileResult, lineIndex: number, expression: string) {
	return `vscode://hpi-swa.polyglot-live-programming/debug-probe?fileUri=${encodeURIComponent(fileResult.uri)}&languageId=${fileResult.languageId}&lineIndex=${lineIndex}&expression=${encodeURIComponent(expression)}`;
}

function createDebugSuffix(fileResult: ba.BabylonianAnalysisFileResult, lineIndex: number, example: ba.ExampleResult) {
	const exampleExpression = findExampleExpression(example.exampleName);
	return exampleExpression ? ` [🐞](${createProbeDebugUrl(fileResult, lineIndex, exampleExpression)})` : '';
}

function showProbeDetails(query: URLSearchParams) {
	const fileUri = decodeURIComponent(query.get('fileUri') || '');
	const lineIndex = parseInt(query.get('lineIndex') || '');
	const exampleName = decodeURIComponent(query.get('exampleName') || '');
	const observedValueIndex = parseInt(query.get('observedValueIndex') || '');
	if (isNaN(lineIndex) || isNaN(observedValueIndex)) {
		return;
	}
	const result = getLastBabylonianResult();
	for (const file of result.files) {
		if (file.uri.toString() === fileUri) {
			for (const probe of file.probes) {
				if (probe.lineIndex === lineIndex) {
					for (const example of probe.examples) {
						if (example.exampleName === exampleName && observedValueIndex < example.observedValues.length) {
							updateObjectExplorer(example.observedValues[observedValueIndex]);
						}
					}
				}
			}
		}
	}
}

function debugProbe(query: URLSearchParams) {
	const fileUri = vscode.Uri.parse(decodeURIComponent(query.get('fileUri') || ''));
	const languageId = query.get('languageId') || '';
	const lineIndex = parseInt(query.get('lineIndex') || '');
	const expression = decodeURIComponent(query.get('expression') || '');
	if (isNaN(lineIndex)) {
		return;
	}
	const position = new vscode.Position(lineIndex, 0);
	const breakpoint = new vscode.SourceBreakpoint(new vscode.Location(fileUri, position));
	vscode.debug.addBreakpoints([breakpoint]);
	vscode.debug.startDebugging(undefined, {
		name: 'Debug Babylonian Probe with GraalVM',
		type: 'graalvm',
		request: 'launch',
		cwd: vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : path.dirname(fileUri.fsPath),
		runtimeExecutable: 'polyglot',
		runtimeArgs: ['--jvm', '--file', fileUri.fsPath, '--eval', `${languageId}:${expression}`, '--dap.Suspend=false'],
	});
}

function findExampleExpression(exampleName: string): string | undefined {
	if (lastBabylonianResult) {
		for (const file of lastBabylonianResult.files) {
			for (const probe of file.probes) {
				if (probe.probeType === ba.ProbeType.example) {
					for (const example of probe.examples) {
						if (example.exampleName === exampleName && example.observedValues.length === 1) {
							return example.observedValues[0].expression;
						}
					}
				}
			}
		}
	}
}

function containsExemplifiedCode(document: vscode.TextDocument): boolean {
	return document.getText().includes(EXAMPLE_PREFIX);
}

function prettifyExampleName(name: string) {
	return name.startsWith('<Example') ? name.substring(9, name.length - 3) : name;
}

function truncate(value: string, n: number) {
	return (value.length > n) ? value.substr(0, n - 1) + '\u2026' : value;
}

function toRichMarkdown(value: string, n: number): string {
	const truncated = truncate(value, n);
	const startIndex = Math.max(value.indexOf('<svg xmlns="http://www.w3.org/2000/svg"'), value.indexOf('<svg xmlns=\'http://www.w3.org/2000/svg\''));
	if (startIndex > 0) {
		return `![${truncated}](data:image/svg+xml;base64,${toBase64(value.substring(startIndex, value.indexOf('</svg>') + 6))})`;
	} else {
		return truncated;
	}
}

function toBase64(value: string): string {
	return Buffer.from(value, 'binary').toString('base64');
}

function toEmoticon(value: string): string {
	let index = 0;
	for (let i = 0; i < value.length; i++) {
		index = (31 * index + value.charCodeAt(i)) % EMOJIS_LENGTH;
	}
	return EMOJIS[index];
}
