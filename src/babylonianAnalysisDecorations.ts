/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import * as ba from './babylonianAnalysisTypes';

export class DecorationManager {
	cache: { [key: string]: { [key: string]: { examples: string[], probeType: ba.ProbeType, decorationType: vscode.TextEditorDecorationType } } } = {};

	getDecorationType(fileUri: string, probe: ba.AbstractProbe): vscode.TextEditorDecorationType {
		const lineMap = this.cache[fileUri] = (this.cache[fileUri] || {});
		if (lineMap[probe.lineIndex]) {
			const lineCache = lineMap[probe.lineIndex];
			if (lineCache.probeType === probe.probeType && hasSameOrderedContents(lineCache.examples, probe.examples.map(e => e.exampleName).sort())) {
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
		lineMap[probe.lineIndex] = {
			examples: probe.examples.map(e => e.exampleName).sort(),
			probeType: probe.probeType,
			decorationType: this.createDecorationType(color, backgroundColor)
		};
		return lineMap[probe.lineIndex].decorationType;
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
		Object.keys(this.cache).map(this.clearDecorationsOfUri);
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

function hasSameOrderedContents(array1: Object[], array2: Object[]) {
	return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}
