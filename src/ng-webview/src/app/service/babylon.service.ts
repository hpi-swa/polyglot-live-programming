import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { AbstractProbe, ExampleResult, ProbeType } from '../../../../babylonianAnalysisTypes';
import { BabylonExample, BabylonRow } from '../model/babylon.model';
import { CommunicationService } from './communication.service';

@Injectable({
  providedIn: 'root'
})
export class BabylonService {

  private background: string = " ";
  private resultMap: BehaviorSubject<Array<BabylonExample>>;

  constructor(private communicationService: CommunicationService) {
    this.resultMap = new BehaviorSubject<Array<BabylonExample>>(new Array<BabylonExample>());
    this.communicationService.getAbstractProbes().subscribe(this.handleResult.bind(this));
    this.communicationService.background.subscribe((value) => this.background = value);
  }

  private handleResult(result: Array<AbstractProbe>) {
    var backgroundRows = this.background.match(/[^\n]*\n[^\n]*?/g);
    var resultList = new Array<BabylonExample>();
    if (backgroundRows) {
      for (var i = 0; i < backgroundRows.length; i++) {
        var example = this.extractBabylonExample(backgroundRows, i, result);
        i = example.endLine - 1;
        resultList.push(example);
      }
      console.log(resultList);
    }
    this.resultMap.next(resultList);
  }

  private extractBabylonExample(backgroundRows: Array<string>, i: number, result: Array<AbstractProbe>) {
    var example = new BabylonExample(i + 1);
    var findEnd = false;
    for (var j = i; j < backgroundRows.length; j++) {
      var row = new BabylonRow();
      row.text = backgroundRows[j];
      this.extractAbstractProbe(result, row, j);
      if (row.probeType === ProbeType.example) {
        if (findEnd) {
          example.endLine = j + 1;
          return example;
        }
        example.examples.push(row);
      } else {
        findEnd = true;
        example.rows.push(row);
      }
    }
    example.endLine = backgroundRows.length;
    return example;
  }

  private extractAbstractProbe(result: Array<AbstractProbe>, row: BabylonRow, i: number) {
    var filtered = result.filter(probe => probe.lineIndex === i);
    if (filtered && filtered.length > 0) {
      row.examples = filtered[0].examples;
      row.line = filtered[0].lineIndex + 1;
      row.probeType = filtered[0].probeType;
      // row.observedValues = this.getObservedValues(filtered[0]);
    }
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
    return r;
  }

  getResultMap(): Observable<Array<BabylonExample>> {
    return this.resultMap.asObservable();
  }

  public updateResultMap(linNum: number, text: string) {
    this.communicationService.postMessage({
      editLine: text,
      line: linNum
    });
  }

  public waitForElement(elementId: string, initialValue: any, callBack) {
    window.setTimeout(() => {
      var element = document.getElementById(elementId);
      if (element) {
        callBack(elementId, initialValue);
      } else {
        this.waitForElement(elementId, initialValue, callBack);
      }
    }, 500);
  }
}
