import { ExampleResult, ProbeType } from "../../../../babylonianAnalysisTypes";

export class BabylonRow {
    line: number;
    probeType: ProbeType;
    examples: ExampleResult[];
    text: string;
    observedValues: Array<string>;
}
