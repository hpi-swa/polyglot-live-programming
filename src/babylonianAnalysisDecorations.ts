/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import * as ba from './babylonianAnalysisTypes';

export class DecorationManager {
	cache: { [key: string]: { [key: string]: { cacheIdentifier: string, decorationType: vscode.TextEditorDecorationType } } } = {};

	getDecorationType(fileUri: string, isFinalResult: boolean, probe: ba.AbstractProbe): vscode.TextEditorDecorationType {
		const lineMap = this.cache[fileUri] = (this.cache[fileUri] || {});
		const cacheIdentifier = this.toCacheIdentifier(fileUri, isFinalResult, probe);
		if (lineMap[probe.lineIndex]) {
			const lineCache = lineMap[probe.lineIndex];
			if (lineCache.cacheIdentifier === cacheIdentifier) {
				return lineCache.decorationType;
			}
			lineMap[probe.lineIndex].decorationType.dispose();
			delete lineMap[probe.lineIndex];
		}
		let color = "white";
		let backgroundColor = "red";
		switch (probe.probeType) {
			case ba.ProbeType.assertion:
				backgroundColor = allAssertionsTrue(probe.examples) ? "#0d9e00" : "#bd0000";
				break;
			case ba.ProbeType.example:
				backgroundColor = "#636360";
				break;
			case ba.ProbeType.orphan:
				backgroundColor = "grey";
				break;
			case ba.ProbeType.probe:
				backgroundColor = "#4e7ec2";
				break;
			case ba.ProbeType.selection:
				backgroundColor = "#c24eb8";
				break;
			default:
				console.warn('Unknown decoration type:', probe.probeType);
		}
		if (isFinalResult && probe.examples.length === 0) {
			backgroundColor = "lightgrey";
		}
		lineMap[probe.lineIndex] = {
			cacheIdentifier: cacheIdentifier,
			decorationType: this.createDecorationType(color, backgroundColor)
		};
		return lineMap[probe.lineIndex].decorationType;
	}

	private toCacheIdentifier(fileUri: string, isFinalResult: boolean, probe: ba.AbstractProbe): string {
		const components = [fileUri, String(probe.lineIndex)];
		if (isFinalResult && probe.examples.length === 0) {
			components.push('empty-final-result');
		} else {
			components.concat(probe.examples.map(e => e.exampleName).sort());
			if (probe.probeType === ba.ProbeType.assertion) {
				components.push(String(allAssertionsTrue(probe.examples)));
			}
		}
		return components.join('-');
	}

	private createDecorationType(color: string, backgroundColor: string): vscode.TextEditorDecorationType {
		return vscode.window.createTextEditorDecorationType({
			after: {
				color,
				backgroundColor,
				margin: '1rem',
			},
		});
	}

	clearAllDecorations() {
		Object.keys(this.cache).map(fileUri => this.clearDecorationsOfUri(fileUri));
	}
	
	clearRedundantDecorations(result : ba.BabylonianAnalysisResult) {
		for (const fileUri of Object.keys(this.cache)) {
			const fileResult = result.files.find(f => f.uri === fileUri);
			if (fileResult) {
				const lineMap = this.cache[fileUri];
				Object.keys(lineMap).filter(t => fileResult.probes.every(f => "" + f.lineIndex !== t)).map(t => {
					lineMap[t].decorationType.dispose();
					delete lineMap[t];
				});
			} else {
				this.clearDecorationsOfUri(fileUri);
			}
		}
	}
	
	private clearDecorationsOfUri(fileUri: string) {
		const lineMap = this.cache[fileUri];
		if (lineMap) {
			Object.keys(lineMap).map(lineIndex => {
				lineMap[lineIndex].decorationType.dispose();
			});
			delete this.cache[fileUri];
		}
	}
}

function allAssertionsTrue(results: ba.ExampleResult[]): boolean {
	for (const result of results) {
		for (const value of result.observedValues) {
			if (value.displayString !== 'true') {
				return false;
			};
		}
	}
	return true;
}
