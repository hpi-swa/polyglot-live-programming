import { Component, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';

import { CommunicationService } from 'src/app/service/communication.service';
import { BabylonService } from 'src/app/service/babylon.service';
import { BabylonRow } from 'src/app/model/babylon-row.model';


@Component({
    selector: 'webview-babylonian-analysis',
    templateUrl: './babylonian-analysis.component.html',
    styleUrls: ['./babylonian-analysis.component.css']
})
export class BabylonianAnalysisComponent implements OnInit  {
    public textArea: string = 'webViewText';
    public editorConfig: Array<string>;
    result: Array<BabylonRow>;

    constructor(private communicationService: CommunicationService, private babylonService: BabylonService) { }

    ngOnInit(): void {
        this.babylonService.getResultMap().subscribe((value) => this.processResult(value));
        this.communicationService.getEditorConfig().subscribe((value) => {
            this.editorConfig = value;
            this.babylonService.waitForElement('container', this.editorConfig, function () {
                document.getElementById(arguments[0]).style.fontFamily = arguments[1][0];
                document.getElementById(arguments[0]).style.fontSize = arguments[1][1] + 'px';
                Array.from(document.getElementsByClassName('paragraph')).forEach(element => {
                    ((element) as HTMLElement).style.fontSize = arguments[1][1] + 'px';
                });
            });
        });
    }

    private processResult(result: Array<BabylonRow>) {
        this.result = result;
        result.filter(e => e.observedValues && e.observedValues.length > 0).forEach(res => this.setInitialvalues(res));
    }

    private setInitialvalues(probe: BabylonRow) {
        const initialValue: string = probe.observedValues[0];
        const webViewTextId: string = this.textArea.concat(probe.line.toString());
        this.babylonService.waitForElement(webViewTextId, initialValue, function () {
            document.getElementById(arguments[0])!.innerHTML = arguments[1];
        });
    }
}





