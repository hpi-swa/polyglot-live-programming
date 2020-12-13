import { Component, OnChanges, OnInit } from '@angular/core';
import { AbstractProbe, ProbeType } from '../../../../babylonianAnalysisTypes';
import { MatSliderChange } from '@angular/material/slider';

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
  public result$: Map<Array<number>, AbstractProbe> = new Map();
  public myMap = new Map([]); 
  public overallResult: string;
  public background: string;


  constructor() { }

  ngOnInit(): void {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.result) {
        this.handleResult(message.result);
        if (this.overallResult) {
          // TODO: Handle Default / Initial Values here
          console.log("Er ist rein");
          this.updateTextArea(this.overallResult, "webViewText0");
        }
      } else if (message.background) {
        this.background = message.background;
      }
    });
  }

  updateSliderLabel(value: any) {
    return value;
  }

  onSliderChange(event: MatSliderChange) {
    const sliderId: string = event.source._elementRef.nativeElement.id;
    const sliderValue: number = event.value;
    if (sliderId === '0') {
      this.updateTextArea(this.overallResult, "webViewText0");
    } else {
      let values = this.myMap.get('rangeSlider'.concat(sliderId));
      this.updateTextArea(values[sliderValue-1], "webViewText".concat(sliderId));
    }
  }

  private updateTextArea(text: string, textAreaId: string) {
    document.getElementById(textAreaId)!.innerHTML = text;
  }

  private handleResult(result: Array<AbstractProbe>) {
    let idx = 0;
    let previousLineIdx: number;
    for (const probe of result) {
      idx ++;
      console.log("Entrypoint");
      console.log(previousLineIdx);
      console.log("Probe.lineIndex");
      console.log(probe.lineIndex);
      if (!previousLineIdx) {
        previousLineIdx = probe.lineIndex;
      }
      if (probe.probeType === ProbeType.example) {
        console.log("NR of br");
        console.log(probe.lineIndex - previousLineIdx);
        if (probe.lineIndex === 0) {
          this.result$.set(new Array<number>(probe.lineIndex - previousLineIdx), probe);
        } else {
          this.result$.set(new Array<number>(probe.lineIndex - (previousLineIdx+1)), probe);
        }
        this.handleExample(probe);
        previousLineIdx = probe.lineIndex;
      }
      if (probe.probeType === ProbeType.probe) {
        if (idx === 2) {
          console.log("NR of br");
          console.log(probe.lineIndex - previousLineIdx);
          this.result$.set(new Array<number>(probe.lineIndex-1), probe);
          this.handleProbe(probe);
          previousLineIdx = probe.lineIndex;
        } else {
          console.log("NR of br");
          console.log(probe.lineIndex - previousLineIdx);
          this.result$.set(new Array<number>(probe.lineIndex - (previousLineIdx+1)), probe);
          this.handleProbe(probe);
          previousLineIdx = probe.lineIndex;
        }

      }
    }
    console.log(this,result);
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





