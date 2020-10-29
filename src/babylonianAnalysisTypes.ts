/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { ObjectInformation } from './objectExplorerTypes';

export enum ProbeType {
	assertion = 'ASSERTION',
	example = 'EXAMPLE',
	orphan = 'ORPHAN',
	probe = 'PROBE',
	replacement = 'REPLACEMENT',
	selection = 'SELECTION',
}

export interface ExampleResult {
	readonly exampleName: string;
	readonly observedValues: ObjectInformation[];
}

export interface AbstractProbe {
	readonly probeType: ProbeType;
	readonly lineIndex: number;
	readonly examples: ExampleResult[];
}

export interface BabylonianAnalysisFileResult {
	readonly uri: string;
	readonly languageId: string;
	readonly probes: AbstractProbe[];
}

export interface BabylonianAnalysisResult {
	readonly files: BabylonianAnalysisFileResult[];
}

export interface BabylonianAnalysisTerminationResult {
	readonly timeToRunMillis: number;
	readonly result?: BabylonianAnalysisResult;
	readonly error?: string;
}
