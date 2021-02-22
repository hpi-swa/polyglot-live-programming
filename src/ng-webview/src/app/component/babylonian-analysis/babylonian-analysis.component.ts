import { Component, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';

import { CommunicationService } from 'src/app/service/communication.service';
import { BabylonService } from 'src/app/service/babylon.service';
import { BabylonExample, BabylonRow } from 'src/app/model/babylon.model';


@Component({
    selector: 'webview-babylonian-analysis',
    templateUrl: './babylonian-analysis.component.html',
    styleUrls: ['./babylonian-analysis.component.css']
})
export class BabylonianAnalysisComponent implements OnInit {
    public textArea: string = 'webViewText';
    public editorConfig: Array<string>;
    result: Array<BabylonExample>;

    constructor(private communicationService: CommunicationService, private babylonService: BabylonService) { }

    ngOnInit(): void {
        this.babylonService.getResultMap().subscribe((value) => this.result = value);
        this.communicationService.getEditorConfig().subscribe((value) => {
            this.editorConfig = value;
            
            if (value.length > 1) {
                this.buildStyleMap();
                this.babylonService.waitForElement('container', this.babylonService, function () {
                    Array.from(document.getElementsByClassName('paragraph')).forEach(element => {
                        //arguments[1].setFontStyles(element);
                    });
                });
            }

        });
    }

    private buildStyleMap() {
        this.babylonService.styleMap = new Map();
        if (this.editorConfig[0]) {
            this.babylonService.styleMap.set('font-family', this.editorConfig[0]);

        }
        if (this.editorConfig[1]) {
            let lineHeight = parseInt(this.editorConfig[1]) * 1.5;
            this.babylonService.styleMap.set('font-size', this.editorConfig[1] + 'px');
            this.babylonService.styleMap.set('line-height', lineHeight.toString() + 'px');
        }
        this.babylonService.styleMap.set('font-weight', 'normal');
        this.babylonService.styleMap.set('letter-spacing', '0px');
        this.babylonService.styleMap.set('font-feature-settings', 'liga:0, calt:0');
    }
}





