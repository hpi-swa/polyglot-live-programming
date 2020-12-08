import { Component, OnChanges, OnInit } from '@angular/core';
import { AbstractProbe, ProbeType } from '../../../../babylonianAnalysisTypes';

@Component({
  selector: 'webview-babylonian-analysis',
  templateUrl: './babylonian-analysis.component.html',
  styleUrls: ['./babylonian-analysis.component.css']
})
export class BabylonianAnalysisComponent implements OnInit {
  public textArea: string = 'webViewText';
  public observedValues: Array<string> = [];
  public observedProbes: Array<string> = [];
  public activeOutput: string;
  public lineIndex: any;
  public result$: Array<AbstractProbe> = [];
  public myMap = new Map([]); 
  public overallResult: string;


  constructor() { }

  ngOnInit(): void {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.result) {
        this.handleResult(message.result);
        if (this.observedValues[0] && this.observedProbes[0]) {
          // TODO: Handle Default / Initial Values here
        }
      }
    });
  }

  silderUpdate(event) {
    const sliderId: string = (event.target as Element).id;
    if (sliderId === 'rangeSlider0') {
      this.updateTextArea(this.overallResult, "webViewText0");
    } else {
      const value = event.target.value;
      let values = this.myMap.get(sliderId);
      this.updateTextArea(values[value], "webViewText".concat(sliderId.replace('rangeSlider', '')));
    }
   }

  private updateTextArea(text: string, textAreaId: string) {
    document.getElementById(textAreaId)!.innerHTML = text;
  }

  private handleResult(result: Array<AbstractProbe>) {

    for (const probe of result) {
        if (probe.probeType === ProbeType.example) {
          this.result$.push(probe);
          this.handleExample(probe);
        }
        if (probe.probeType === ProbeType.probe) {
          this.result$.push(probe);
          this.handleProbe(probe);
        }
    }
  }

  private handleExample(probe: AbstractProbe) {
    console.log(probe.examples[0].observedValues[0].displayString);
    this.overallResult = probe.examples[0].observedValues[0].displayString;
    this.myMap.set("rangeSlider".concat(probe.lineIndex.toString()), probe.examples[0].observedValues[0].displayString);
  }

  private handleProbe(probe: AbstractProbe) {
    if (!this.lineIndex) {
        this.lineIndex = probe.lineIndex;
    }
    for (const example of probe.examples) {
        if (probe.lineIndex === this.lineIndex) {
            if (example.observedValues) {
                this.proceedObservedValues(example, this.observedValues);
                this.myMap.set("rangeSlider".concat(probe.lineIndex.toString()), this.observedValues);
            }
        } else {
          this.proceedObservedValues(example, this.observedProbes);
          this.myMap.set("rangeSlider".concat(probe.lineIndex.toString()), this.observedProbes);
        }
    }
  }

  private proceedObservedValues(example: any, pushToArray: Array<string>) {
    if (example.observedValues.length > 1) {
        let observedValue;
        for (observedValue of example.observedValues) {
            pushToArray.push(observedValue.displayString);
        }
    } else {
        pushToArray.push(example.observedValues[0].displayString);
    }
  }
}





