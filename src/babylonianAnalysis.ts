/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import { pathToFileURL, URLSearchParams } from 'url';
import { updateObjectExplorer, ObjectInformation } from './objectExplorer';
import { UriHandler } from './uriHandler';
import table from 'markdown-table';

let isEnabled = false;
let isServerSupportAvailable = false;

export const BABYLONIAN_ANALYSIS_RESULT_METHOD: string = 'textDocument/babylonianAnalysisResult';
const PROBE_DECORATION_TYPE = 'PROBE_DECORATION';
const ASSERTION_DECORATION_TYPE = 'ASSERTION_DECORATION';
const EXAMPLE_DECORATION_TYPE = 'EXAMPLE_DECORATION';
const EXAMPLE_PREFIX = '<Example ';
const EMOJIS = ['⏰', '🌈', '🌏', '🌽', '🍄', '🍔', '🍕', '🍙', '🍟', '🍪', '🍰', '🎁', '🎂', '🎉', '🏆', '🏠', '🐟', '🐰', '👑', '👻', '💊', '📣', '💰', '📌', '📦', '📷', '🔑', '🔥', '🔫', '🚀', '🚕', '🚁' ];
const EMOJIS_LENGTH = EMOJIS.length;

const ON_CHANGE_TIMEOUT = 750;

const ACTIVE_DECORATION_TYPES: vscode.TextEditorDecorationType[] = [];

let lastBabylonianRequest: NodeJS.Timeout|null = null;
let lastBabylonianResult: BabylonianAnalysisResult;


const enum ProbeType {
	example = 'EXAMPLE',
	probe = 'PROBE',
	assertion = 'ASSERTION',
	replacement = 'REPLACEMENT'
}

interface ProbeResult {
	readonly probeType: ProbeType,
	readonly exampleName: string,
	readonly observedValues: ObjectInformation[]
}

interface BabylonianAnalysisLineResult {
	readonly lineIndex: number,
	readonly probes: ProbeResult[];
}

interface BabylonianAnalysisFileResult {
	readonly uri: string;
    readonly lines: BabylonianAnalysisLineResult[];
}

interface BabylonianAnalysisResult {
    readonly files: BabylonianAnalysisFileResult[];
}

function createDecorationType(line: BabylonianAnalysisLineResult): vscode.TextEditorDecorationType {
	const firstProbeType = line.probes[0].probeType;
	switch (firstProbeType) {
		case ProbeType.assertion:
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: 'white',
					backgroundColor: allAssertionsTrue(line.probes) ? '#0d9e00' : '#bd0000',
					margin: '1rem',
				},
			});
		case ProbeType.example:
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: 'white',
					backgroundColor: '#636360',
					margin: '1rem',
				},
			});
		case ProbeType.probe:
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: 'white',
					backgroundColor: '#4e7ec2',
					margin: '1rem',
				},
			});
		default:
			console.warn('Unknown decoration type:', firstProbeType);
			return vscode.window.createTextEditorDecorationType({
				after: {
					color: 'white',
					backgroundColor: 'red',
					margin: '1rem',
				},
			});
	}
}

function allAssertionsTrue(probes: ProbeResult[]): boolean {
	for (const probe of probes) {
		for (const value of probe.observedValues) {
			if (value.displayString !== 'true') {
				return false;
			};
		}
	}
	return true;
}

function joinDisplayStrings(values: ObjectInformation[]): string {
	const strings: string[] = [];
	for (const value of values) {
		strings.push(value.displayString);
	}
	return strings.join('\u2794');
}

function createDecorationText(line: BabylonianAnalysisLineResult): string {
	const probeTexts: string[] = [];
	for (const probe of line.probes) {
		probeTexts.push(`${toEmoticon(probe.exampleName)} ${truncate(joinDisplayStrings(probe.observedValues), 50)}`);
	}
	return probeTexts.join(' ');
}

function createHoverMessage(fileUri: string, line: BabylonianAnalysisLineResult): vscode.MarkdownString {
	const maxNumberOfObservedValues = getMaxNumberOfObservedValues(line.probes);
	let tableData: string[][];
	if (maxNumberOfObservedValues > 1) {
		tableData = [['']];
		for (let index = 1; index <= maxNumberOfObservedValues; index++) {
			tableData.push([`${index}.`]);
		}
		for (const probe of line.probes) {
			pushProbeWithMultipleObservedValues(tableData, fileUri, line.lineIndex, probe, maxNumberOfObservedValues);
		}
	} else {
		tableData = [[''], ['displayString'], ['metaName'], [''], ['properties'], ['member(s)'], ['element(s)']];
		for (const probe of line.probes) {
			pushProbeWithSingleObservedValue(tableData, fileUri, line.lineIndex, probe);
		}
	}
	return new vscode.MarkdownString(`${table(tableData, {align: 'c'})}`);
}

function getMaxNumberOfObservedValues(probes: ProbeResult[]) : number {
	let maxLength = 1;
	for (const probe of probes) {
		maxLength = Math.max(maxLength, probe.observedValues.length);
	}
	return maxLength;
}

function pushProbeWithSingleObservedValue(tableData: string[][], fileUri: string, lineIndex: number, probe: ProbeResult) {
	const observedValue = probe.observedValues[probe.observedValues.length - 1];
	tableData[0].push(`[${truncate(prettifyExampleName(probe.exampleName), 20)} ${toEmoticon(probe.exampleName)}](${createProbeInspectionUrl(fileUri, lineIndex, probe.exampleName, 0)})`);
	tableData[1].push(observedValue.error ? truncate(observedValue.error, 20) : toRichMarkdown(observedValue.displayString, 20));
	tableData[2].push(observedValue.metaSimpleName || '-');
	tableData[3].push('');
	tableData[4].push(observedValue.interopProperties.map(s => `*${s}*`).join(', ') || '-');
	tableData[5].push(`${(observedValue.memberNames || []).length}`);
	tableData[6].push(`${(observedValue.elements || []).length}`);
}

function pushProbeWithMultipleObservedValues(tableData: string[][], fileUri: string, lineIndex: number,  probe: ProbeResult, maxNumberOfObservedValues: number) {
	tableData[0].push(`${truncate(prettifyExampleName(probe.exampleName), 20)} ${toEmoticon(probe.exampleName)}`);
	const numberOfObservedValues = probe.observedValues.length;
	for (let index = 0; index < maxNumberOfObservedValues; index++) {
		let result;
		if (index < numberOfObservedValues) {
			const value =  probe.observedValues[index];
			result = `[${truncate(value.error ? value.error : value.displayString, 20)}](${createProbeInspectionUrl(fileUri, lineIndex, probe.exampleName, index)})`;
		} else {
			result = '';
		}
		tableData[1 + index].push(result);
	}
}

function createDecorationOptions(editor: vscode.TextEditor, file: BabylonianAnalysisFileResult, line: BabylonianAnalysisLineResult): vscode.DecorationOptions {
	return {
		hoverMessage: [
			'### Babylonian Analysis',
			createHoverMessage(file.uri, line),
		],
		range: editor.document.lineAt(line.lineIndex).range,
		renderOptions: {
			after: {
				contentText: `\u202F${createDecorationText(line)}\u202F`,
			},
		},
	};
}

function clearDecorations() {
	while(ACTIVE_DECORATION_TYPES.length > 0) {
		ACTIVE_DECORATION_TYPES.pop()?.dispose();
	}
}

function handleBabylonianAnalysisResult(result : BabylonianAnalysisResult) {
	lastBabylonianResult = result;
	// Clear decorations to allow new updated ones.
	clearDecorations();
	for (const file of result.files) {
		const editor = vscode.window.visibleTextEditors.filter(editor => editor.document.uri.toString() === file.uri)[0];
		if (editor) {
			for (const line of file.lines) {
				if (line.probes.length > 0) {
					const decorationType = createDecorationType(line);
					const decorationOptions = createDecorationOptions(editor, file, line);
					ACTIVE_DECORATION_TYPES.push(decorationType);
					editor.setDecorations(decorationType, [decorationOptions]);
				}
			}
		}
	}
}

export function initializeBabylonianAnalysis(context: vscode.ExtensionContext, uriHandler: UriHandler) {
	context.subscriptions.push(vscode.commands.registerCommand('vscode-live-programming.toggleBabylonianAnalysis', () => {
		toggleBabylonianAnalysis();
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => handleOnDidChangeTextDocument(event.document)));
	registerSetDecorationHandler();
	uriHandler.onPath('/show-probe-details', showProbeDetails);
}

function registerSetDecorationHandler() : void {
	vscode.commands.getCommands().then((commands: string[]) => {
		if (commands.includes('extension.graalvm.registerLSPNotificationHandler')) {
			vscode.commands.executeCommand('extension.graalvm.registerLSPNotificationHandler', BABYLONIAN_ANALYSIS_RESULT_METHOD, handleBabylonianAnalysisResult).then((result) => {
				if(!result) {
					console.error('Failed to register handleBabylonianAnalysisResult notification handler.');		
				}
			});
		} else {
			console.error('Unable to find GraalVM extension.');
		}
	});
}

function requestBabylonianAnalysis(document: vscode.TextDocument): void {
	clearDecorations();
	serverSupportAvailable().then(available => {
		if (available) {
			let disposable = vscode.window.setStatusBarMessage('Performing Babylonian Analysis...');
			console.log('Requesting Babylonian Analysis...');
			console.time('Babylonian Analysis execution');
			vscode.commands.executeCommand('babylonian_analysis', pathToFileURL(document.uri.fsPath)).then((result) => {
				console.timeEnd('Babylonian Analysis execution');
				disposable.dispose();
				if (!result) {
					console.warn('Babylonian Analysis was not successful');
				}
			});
		} else {
			vscode.window.showErrorMessage('Babylonian Analysis not supported by language server.');
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

function handleOnDidChangeTextDocument(document: vscode.TextDocument) {
	if (isEnabled && document.getText().includes(EXAMPLE_PREFIX)) {
		if (lastBabylonianRequest) {
			clearTimeout(lastBabylonianRequest);
		}
		lastBabylonianRequest = setTimeout(() => requestBabylonianAnalysis(document), ON_CHANGE_TIMEOUT);
	}
}

export function getLastBabylonianResult() {
	return lastBabylonianResult;
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

/*
 * UTILITIES
 */

function createProbeInspectionUrl(fileUri: string, lineIndex: number, exampleName: string, observedValueIndex: number) {
    return `vscode://hpi-swa.vscode-live-programming/show-probe-details?fileUri=${encodeURIComponent(fileUri)}&lineIndex=${lineIndex}&exampleName=${encodeURIComponent(exampleName)}&observedValueIndex=${observedValueIndex}`;
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
			for (const line of file.lines) {
				if (line.lineIndex === lineIndex) {
					for (const probe of line.probes) {
						if (probe.exampleName === exampleName && observedValueIndex < probe.observedValues.length) {
							updateObjectExplorer(probe.observedValues[observedValueIndex]);
						}
					}
				}
			}
		}
	}
}

function prettifyExampleName(name: string) {
	return name.startsWith('<Example') ? name.substring(9, name.length - 3) : name;
}

function truncate(value: string, n: number) {
	return (value.length > n) ? value.substr(0, n - 1) + '\u2026' : value;
}

function toRichMarkdown(value: string, n: number): string {
	const truncated = truncate(value, n);
	if (value.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')) {
		return `![${truncated}](data:image/svg+xml;base64,${toBase64(value)})`;
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
