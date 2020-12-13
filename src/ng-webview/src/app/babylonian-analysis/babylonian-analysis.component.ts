import { Component, OnChanges, OnInit } from '@angular/core';
import { AbstractProbe, ProbeType, ExampleResult } from '../../../../babylonianAnalysisTypes';
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
  public myMap: Map<string, Array<string>> = new Map([]);
  public overallResult: string;
  public background: string;


  constructor() { }

  ngOnInit(): void {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.result) {
        this.handleResult(message.result);
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
      this.updateTextArea(values[sliderValue - 1], "webViewText".concat(sliderId));
    }
  }

  private updateTextArea(text: string, textAreaId: string) {
    document.getElementById(textAreaId)!.innerHTML = text;
  }

  private getObservedValues(result: AbstractProbe): Array<string> {
    let r: Array<string> = [];
    if (result.examples) {
      if (result.examples.length > 1) {
        let exampleResult: ExampleResult;
        for (exampleResult of result.examples) {
          if (exampleResult.observedValues) {
            for (const observedValue of exampleResult.observedValues) {
              if (observedValue.displayString) {
                r.push(observedValue.displayString);
              }
            }
          }
        }
      } else {
        if (result.examples[0].observedValues) {
          for (const observedValue of result.examples[0].observedValues) {
            if (observedValue.displayString) {
              r.push(observedValue.displayString);
            }
          }
        }
      }
    }
    console.log(r);
    return r;
  }

  private handleResult(result: Array<AbstractProbe>) {
    let idx = 0;
    let previousLineIdx: number;
    for (const probe of result) {
      idx++;
      console.log('IDX', idx);
      if (!previousLineIdx) {
        previousLineIdx = probe.lineIndex;
      }
      if (probe.lineIndex === 0) {
        this.result$.set(new Array<number>(probe.lineIndex), probe);
        previousLineIdx = probe.lineIndex;
      } else if (idx === 2) {
        this.result$.set(new Array<number>(probe.lineIndex - 1), probe);
        previousLineIdx = probe.lineIndex;
      } else {
        console.log('Calc Idx:', probe.lineIndex - (previousLineIdx + 1));
        this.result$.set(new Array<number>(probe.lineIndex - (previousLineIdx + 1)), probe);
        previousLineIdx = probe.lineIndex;
      }

      this.buildMapping(probe);
    }
    result.forEach(res => this.setInitialvalues(res));
  }

  private buildMapping(probe: AbstractProbe) {
    this.myMap.set("rangeSlider".concat(probe.lineIndex.toString()), this.getObservedValues(probe));
  }

  private setInitialvalues(probe: AbstractProbe) {
    const initialValue: string = this.getObservedValues(probe)[0];
    const webViewTextId: string = this.textArea.concat(probe.lineIndex.toString());
    this.waitForElement(webViewTextId, initialValue, function () {
      document.getElementById(arguments[0])!.innerHTML = arguments[1];
    });
  }

  private waitForElement(elementId, initialValue, callBack) {
    window.setTimeout(function () {
      var element = document.getElementById(elementId);
      if (element) {
        callBack(elementId, initialValue);
      } else {
        this.waitForElement(elementId, callBack);
      }
    }, 500);
  }
}





