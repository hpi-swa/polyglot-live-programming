/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { ExampleResult, ProbeType } from "../../../../babylonianAnalysisTypes";

export class BabylonRow {
    line: number;
    probeType: ProbeType;
    examples: ExampleResult[];
    text: string;
}

export class BabylonExample {
    startLine: number;
    endLine: number;
    examples: BabylonRow[];
    rows: BabylonRow[];

    constructor(startLine: number) {
        this.startLine = startLine;
        this.examples = new Array();
        this.rows = new Array();
    }

}