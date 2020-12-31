import { Component, OnInit } from '@angular/core';
import { AbstractProbe, ExampleResult } from '../../../../babylonianAnalysisTypes';
import { MatSliderChange } from '@angular/material/slider';
import { vscode } from 'src/constant';

import * as _ from 'lodash';


@Component({
    selector: 'webview-babylonian-analysis',
    templateUrl: './babylonian-analysis.component.html',
    styleUrls: ['./babylonian-analysis.component.css']
})
export class BabylonianAnalysisComponent implements OnInit {
    public textArea: string = 'webViewText';
    public resultMap: Map<Array<number>, AbstractProbe> = new Map();
    public observedValuesMap: Map<string, Array<string>> = new Map([]);
    public background: string;
    public editorConfig: Array<string>;
    public editorLine: number = 0;
    public editorIsScrolling: boolean = false;


    constructor() {
    }

    ngAfterViewInit() {
        window.addEventListener('scroll', (event) => {
            const floatLine = this.getEditorLineNumber();
            if (((this.editorLine  - 0.7) <= floatLine && (this.editorLine  + 0.7) >= floatLine ) && this.editorIsScrolling) {
                this.editorIsScrolling = false;
            } else if (!this.editorIsScrolling) {
                const line = Math.ceil(floatLine);
                vscode.postMessage({ line });
            }
        }, true);
    }

    ngOnInit(): void {
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.result) {
                this.handleResult(message.result);
            } else if (message.background) {
                this.background = message.background;
            } else if (message.editorConfig) {
                this.editorConfig = message.editorConfig;
                this.waitForElement('background', this.editorConfig, function () {
                    document.getElementById(arguments[0]).style.fontFamily = arguments[1][0];
                    document.getElementById(arguments[0]).style.fontSize = arguments[1][1] + 'px';
                    Array.from(document.getElementsByClassName('paragraph')).forEach(element => {
                        ((element) as HTMLElement).style.fontSize = arguments[1][1] + 'px';
                    });
                });
            } else if (message.type === 'scroll') {
                this.editorLine = message.line[0][0].line;
                this.editorIsScrolling = true;
                ((message.line[0][0].line - 1) / message.source.lineCount) * 100;
                const per = (this.editorLine / this.countLines()) * 100;
                this.onUpdateView(per);
            }
        });
    }

    updateSliderLabel(value: any) {
        return value;
    }

    onSliderChange(event: MatSliderChange) {
        const sliderId: string = event.source._elementRef.nativeElement.id;
        const sliderValue: number = event.value;
        let values = this.observedValuesMap.get('rangeSlider'.concat(sliderId));
        this.updateTextArea(values[sliderValue - 1], "webViewText".concat(sliderId));
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
        return r;
    }

    private compareLineIndex(a: AbstractProbe, b: AbstractProbe) {
        if (a.lineIndex < b.lineIndex) {
            return -1;
        }
        if (a.lineIndex > b.lineIndex) {
            return 1;
        }
        return 0;
    }

    private handleResult(result: Array<AbstractProbe>) {
        let idx = 0;
        let currentLine: number;
        result.sort(this.compareLineIndex);
        for (const probe of result) {
            idx++;
            if (!currentLine) {
                currentLine = probe.lineIndex;
            }
            if (probe.lineIndex === 0) {
                this.resultMap.set(new Array<number>(probe.lineIndex), probe);
                currentLine = probe.lineIndex;
            } else if (idx === 2) {
                this.resultMap.set(new Array<number>(probe.lineIndex - 1), probe);
                currentLine = probe.lineIndex;
            } else {
                this.resultMap.set(new Array<number>(probe.lineIndex - (currentLine + 1)), probe);
                currentLine = probe.lineIndex;
            }

            this.buildMapping(probe);
        }
        result.forEach(res => this.setInitialvalues(res));
    }

    private buildMapping(probe: AbstractProbe) {
        this.observedValuesMap.set("rangeSlider".concat(probe.lineIndex.toString()), this.getObservedValues(probe));
    }

    private setInitialvalues(probe: AbstractProbe) {
        const initialValue: string = this.getObservedValues(probe)[0];
        const webViewTextId: string = this.textArea.concat(probe.lineIndex.toString());
        this.waitForElement(webViewTextId, initialValue, function () {
            document.getElementById(arguments[0])!.innerHTML = arguments[1];
        });
    }

    private waitForElement(elementId: string, initialValue: any, callBack) {
        window.setTimeout(function () {
            var element = document.getElementById(elementId);
            if (element) {
                callBack(elementId, initialValue);
            } else {
                this.waitForElement(elementId, callBack);
            }
        }, 500);
    }


    private onUpdateView(line: number) {
        if (!isNaN(line)) {
            const nextPosition = document.body.scrollHeight * (line / 100);
            window.scroll(0, Math.ceil(nextPosition));
        }
    }



    private getEditorLineNumber() {
        const posPercentage = (document.scrollingElement.scrollTop / document.body.scrollHeight) * 100;
        const total = this.countLines();
        return (posPercentage / 100) * total;
    }

    private countLines() {
        return this.background.match(/[^\n]*\n[^\n]*/gi).length;
    }
}





