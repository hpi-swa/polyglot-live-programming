/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { pathToFileURL, URLSearchParams } from 'url';
import { updateObjectExplorer, ObjectInformation } from './objectExplorer';
import { UriHandler } from './uriHandler';
import table from 'markdown-table';
import { GraalVMExtension } from './@types/graalvm';

let isEnabled = false;
let isServerSupportAvailable = false;

export const BABYLONIAN_ANALYSIS_RESULT_METHOD: string = 'textDocument/babylonianAnalysisResult';
const EXAMPLE_PREFIX = '<Example ';
const EMOJIS = ['⏰', '🌈', '🌏', '🌽', '🍄', '🍔', '🍕', '🍙', '🍟', '🍪', '🍰', '🎁', '🎂', '🎉', '🏆', '🏠', '🐟', '🐰', '👑', '👻', '💊', '📣', '💰', '📌', '📦', '📷', '🔑', '🔥', '🔫', '🚀', '🚕', '🚁' ];
const EMOJIS_LENGTH = EMOJIS.length;

const ON_CHANGE_TIMEOUT = 750;

const ACTIVE_DECORATION_TYPES: { [key: string]: { [key: string]: vscode.TextEditorDecorationType } } = {};

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
	readonly languageId: string;
    readonly lines: BabylonianAnalysisLineResult[];
}

interface BabylonianAnalysisResult {
    readonly files: BabylonianAnalysisFileResult[];
}

interface BabylonianAnalysisTerminationResult {
    readonly timeToRunMillis: number;
    readonly error?: string;
}

const FAILURE_RESULT = {timeToRunMillis: 0, error: 'No result'} as BabylonianAnalysisTerminationResult;

function getDecorationType(fileUri: string, line: BabylonianAnalysisLineResult): vscode.TextEditorDecorationType {
	const lineMap = ACTIVE_DECORATION_TYPES[fileUri] = (ACTIVE_DECORATION_TYPES[fileUri] || {});
	if (lineMap[line.lineIndex]) {
		return lineMap[line.lineIndex];
	}
	const firstProbeType = line.probes[0].probeType;
	let color = "white";
	let backgroundColor = "red";
	switch (firstProbeType) {
		case ProbeType.assertion:
			backgroundColor = allAssertionsTrue(line.probes) ? "#0d9e00" : "#bd0000";
			break;
		case ProbeType.example:
			backgroundColor = "#636360";
			break;
		case ProbeType.probe:
			backgroundColor = "#4e7ec2";
			break;
		default:
			console.warn('Unknown decoration type:', firstProbeType);
	}
	return (lineMap[line.lineIndex] = createDecorationType(color, backgroundColor));
}

function createDecorationType(color: string, backgroundColor: string): vscode.TextEditorDecorationType {
	return vscode.window.createTextEditorDecorationType({
		after: {
			color,
			backgroundColor,
			margin: '1rem',
		},
	});
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

function createHoverMessage(fileResult: BabylonianAnalysisFileResult, line: BabylonianAnalysisLineResult): vscode.MarkdownString {
	const maxNumberOfObservedValues = getMaxNumberOfObservedValues(line.probes);
	let tableData: string[][];
	if (maxNumberOfObservedValues > 1) {
		tableData = [['']];
		for (let index = 1; index <= maxNumberOfObservedValues; index++) {
			tableData.push([`${index}.`]);
		}
		for (const probe of line.probes) {
			pushProbeWithMultipleObservedValues(tableData, fileResult, line.lineIndex, probe, maxNumberOfObservedValues);
		}
	} else {
		tableData = [[''], ['displayString'], ['metaName'], [''], ['properties'], ['member(s)'], ['element(s)']];
		for (const probe of line.probes) {
			pushProbeWithSingleObservedValue(tableData, fileResult, line.lineIndex, probe);
		}
	}
	return new vscode.MarkdownString(`${table(tableData, {align: 'c'})}`, true);
}

function getMaxNumberOfObservedValues(probes: ProbeResult[]) : number {
	let maxLength = 1;
	for (const probe of probes) {
		maxLength = Math.max(maxLength, probe.observedValues.length);
	}
	return maxLength;
}

function pushProbeWithSingleObservedValue(tableData: string[][], fileResult: BabylonianAnalysisFileResult, lineIndex: number, probe: ProbeResult) {
	const observedValue = probe.observedValues[probe.observedValues.length - 1];
	tableData[0].push(`[${toEmoticon(probe.exampleName)} ${truncate(prettifyExampleName(probe.exampleName), 20)}](${createProbeInspectionUrl(fileResult, lineIndex, probe.exampleName, 0)})${createDebugSuffix(fileResult, lineIndex, probe)}`);
	tableData[1].push(observedValue.error ? truncate(observedValue.error, 20) : toRichMarkdown(observedValue.displayString, 20));
	tableData[2].push(observedValue.metaSimpleName || '-');
	tableData[3].push('');
	tableData[4].push(observedValue.interopProperties.map(s => `*${s}*`).join(', ') || '-');
	tableData[5].push(`${(observedValue.memberNames || []).length}`);
	tableData[6].push(`${(observedValue.elements || []).length}`);
}

function pushProbeWithMultipleObservedValues(tableData: string[][], fileResult: BabylonianAnalysisFileResult, lineIndex: number,  probe: ProbeResult, maxNumberOfObservedValues: number) {
	tableData[0].push(`${toEmoticon(probe.exampleName)} ${truncate(prettifyExampleName(probe.exampleName), 20)}${createDebugSuffix(fileResult, lineIndex, probe)}`);
	const numberOfObservedValues = probe.observedValues.length;
	for (let index = 0; index < maxNumberOfObservedValues; index++) {
		let result;
		if (index < numberOfObservedValues) {
			const value =  probe.observedValues[index];
			result = `[${truncate(value.error ? value.error : value.displayString, 20)}](${createProbeInspectionUrl(fileResult, lineIndex, probe.exampleName, index)})`;
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
			createHoverMessage(file, line),
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
	Object.keys(ACTIVE_DECORATION_TYPES).map((fileUri) => {
		const lineMap = ACTIVE_DECORATION_TYPES[fileUri];
		Object.keys(lineMap).map((lineIndex) => {
			lineMap[lineIndex].dispose();
		});
		delete ACTIVE_DECORATION_TYPES[fileUri];
	});
}

function handleBabylonianAnalysisResult(result : BabylonianAnalysisResult) {
	lastBabylonianResult = result;
	for (const file of result.files) {
		const editor = vscode.window.visibleTextEditors.filter(editor => editor.document.uri.toString() === file.uri)[0];
		if (editor) {
			for (const line of file.lines) {
				if (line.probes.length > 0) {
					const decorationType = getDecorationType(file.uri, line);
					const decorationOptions = createDecorationOptions(editor, file, line);
					editor.setDecorations(decorationType, [decorationOptions]);
				}
			}
		}
	}
}

export function initializeBabylonianAnalysis(context: vscode.ExtensionContext, graalVMExtension: vscode.Extension<GraalVMExtension>, uriHandler: UriHandler) {
	context.subscriptions.push(vscode.commands.registerCommand('vscode-live-programming.toggleBabylonianAnalysis', () => {
		toggleBabylonianAnalysis();
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => handleOnDidChangeTextDocument(event.document)));
	registerBabylonianAnalysisResultHandler(graalVMExtension);
	uriHandler.onPath('/show-probe-details', showProbeDetails);
	uriHandler.onPath('/debug-probe', debugProbe);
}

function registerBabylonianAnalysisResultHandler(graalVMExtension: vscode.Extension<GraalVMExtension>) : void {
	graalVMExtension.exports.onClientNotification(BABYLONIAN_ANALYSIS_RESULT_METHOD, handleBabylonianAnalysisResult).then((result: boolean) => {
		if (!result) {
			console.error('Failed to register handleBabylonianAnalysisResult notification handler.');
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
			vscode.commands.executeCommand('babylonian_analysis', pathToFileURL(document.uri.fsPath)).then((resultObject) => {
				const result = resultObject as BabylonianAnalysisTerminationResult || FAILURE_RESULT;
				console.timeEnd('Babylonian Analysis execution');
				console.log(`Time to run on GraalLS backend: ${result.timeToRunMillis}ms`);
				disposable.dispose();
				if (result.error) {
					vscode.window.setStatusBarMessage(`BA failed: ${result.error}`, 1000);
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

function createProbeInspectionUrl(fileResult: BabylonianAnalysisFileResult, lineIndex: number, exampleName: string, observedValueIndex: number) {
    return `vscode://hpi-swa.vscode-live-programming/show-probe-details?fileUri=${encodeURIComponent(fileResult.uri)}&lineIndex=${lineIndex}&exampleName=${encodeURIComponent(exampleName)}&observedValueIndex=${observedValueIndex}`;
}

function createProbeDebugUrl(fileResult: BabylonianAnalysisFileResult, lineIndex: number, expression: string) {
    return `vscode://hpi-swa.vscode-live-programming/debug-probe?fileUri=${encodeURIComponent(fileResult.uri)}&languageId=${fileResult.languageId}&lineIndex=${lineIndex}&expression=${encodeURIComponent(expression)}`;
}

function createDebugSuffix(fileResult: BabylonianAnalysisFileResult, lineIndex: number, probe: ProbeResult) {
	const exampleExpression = findExampleExpression(probe.exampleName);
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
	vscode.debug.addBreakpoints([ breakpoint ]);
	vscode.debug.startDebugging(undefined, {
		name: 'Debug Babylonian Probe with GraalVM',
		type: 'graalvm',
		request: 'launch',
		cwd: path.dirname(fileUri.fsPath),
		runtimeExecutable: 'polyglot',
		runtimeArgs: ['--jvm', '--file', fileUri.fsPath, '--eval', `${languageId}:${expression}`, '--dap.Suspend=false'],
	});
}

function findExampleExpression(exampleName: string): string | undefined {
	if (lastBabylonianResult) {
		for (const file of lastBabylonianResult.files) {
			for (const line of file.lines) {
				for (const probe of line.probes) {
					if (probe.probeType === ProbeType.example && probe.exampleName === exampleName) {
						if (probe.observedValues.length === 1) {
							return probe.observedValues[0].expression;
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
