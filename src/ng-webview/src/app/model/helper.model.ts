import { ProbeComponent } from "../component/probe/probe.component";
import { BabylonRow } from "./babylon.model";

export class Probe {
    public static sliderTextFieldIDPrefix: string = 'sliderTextField';
    public static sliderIDPrefix: string = 'slider';

    public sliderTextFieldId: string;
    public sliderId: string;
    public values: Array<string>;
    public defaultValue: number;
    public max: number;
    public sliderActionCounter: number;

    constructor(attributes: {
        babylonText: string;
        values: Array<string>;
        exampleName: string;
    }) {
        this.sliderTextFieldId = Probe.sliderTextFieldIDPrefix.concat(attributes.babylonText.toString())
            .concat(attributes.exampleName);
        this.sliderTextFieldId = Probe.sliderIDPrefix.concat(attributes.babylonText.toString())
            .concat(attributes.exampleName);
        this.values = attributes.values;
        this.defaultValue = 1;
        this.max = this.values.length;
        this.sliderActionCounter = 0;
    }
}