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
    public color: string;
    public color2: string;
    public color3: string;
    public textInput: string;

    constructor(attributes: {
        babylonText: string;
        values: Array<string>;
        exampleName: string;
        color: string;
        defaultValue: number;
        textInput: string;
    }) {
        this.sliderTextFieldId = Probe.sliderTextFieldIDPrefix.concat(attributes.babylonText.toString())
            .concat(attributes.exampleName);
        this.sliderTextFieldId = Probe.sliderIDPrefix.concat(attributes.babylonText.toString())
            .concat(attributes.exampleName);
        this.values = attributes.values;
        this.defaultValue = attributes.defaultValue;
        this.textInput = attributes.textInput;
        this.max = this.values.length;
        this.sliderActionCounter = 0;
        this.color = attributes.color;
    }
}

export class SelectedExampleWrapper {

    public name: string;
    public color: string;

    constructor(attributes: {
        name: string;
        color: string;
    }) {
        this.name = attributes.name;
        this.color = attributes.color;
    }

    public static inSelectedExample(selectedExamples : Array<SelectedExampleWrapper>, key: string) {
        let bool = false;
        selectedExamples.forEach((value) => {
          if(key === value.name) {
            bool = true;
          }
        });
        return bool;
      }
}

export class Example {

    public color: string;
    public example: BabylonRow;
    public selected: boolean;
    public disabled: boolean;

    constructor(attributes: {
        example: BabylonRow;
        color: string;
        selected: boolean;
        disabled: boolean;
    }) {
        this.color = attributes.color;
        this.example = attributes.example;
        this.selected = attributes.selected;
        this.disabled = attributes.disabled;
    }
}