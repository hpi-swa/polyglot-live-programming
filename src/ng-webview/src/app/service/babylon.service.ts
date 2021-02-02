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
    this.communicationService.getAbstractProbes().subscribe(this.handleResult2.bind(this));
    this.communicationService.background.subscribe((value) => this.background = value);
  }

  private handleResult2(result: Array<AbstractProbe>) {
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
      this.extractAbstractProbe(result, row, j);
      row.text = backgroundRows[j];
      if (row.probeType === ProbeType.example) {
        if(findEnd) {
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
      row.observedValues = this.getObservedValues(filtered[0]);
    }
  }

  private handleResult(result: Array<AbstractProbe>) {
    var backgroundRows = this.background.match(/[^\n]*\n[^\n]*?/g);
    var resultList = new Array<BabylonRow>();
    if (backgroundRows) {
      var resultList = new Array<BabylonRow>(backgroundRows.length);
      var example: BabylonRow;
      for (var i = 0; i <= backgroundRows.length; i++) {
        var row = new BabylonRow();
        var filtered = result.filter(probe => probe.lineIndex === i);
        if (filtered && filtered.length > 0) {
          row.examples = filtered[0].examples;
          row.line = filtered[0].lineIndex + 1;
          row.probeType = filtered[0].probeType;
          row.observedValues = this.getObservedValues(filtered[0]);
        }
        row.text = backgroundRows[i];
        if (row.probeType && row.probeType === ProbeType.example) {
          if (example) {
            example.examples.push(row.examples[0]);
            example.text = example.text.concat(row.text);
          } else {
            example = row;
          }
          continue;
        }
        if (example) {
          resultList[example.line - 1] = example;
        }
        example = null;
        resultList[i] = row;
      }
    }
    resultList.sort(this.compareLineIndex);

 //   this.resultMap.next(resultList);
  }

  private compareLineIndex(a: BabylonRow, b: BabylonRow) {
    if (a.line < b.line) {
      return -1;
    }
    if (a.line > b.line) {
      return 1;
    }
    return 0;
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
