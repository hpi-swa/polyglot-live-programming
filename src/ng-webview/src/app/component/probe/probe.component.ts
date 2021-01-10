import { Input, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { BabylonRow } from 'src/app/model/babylon-row.model';
import { BabylonService } from 'src/app/service/babylon.service';
import { Renderer2, RendererFactory2 } from '@angular/core';

@Component({
  selector: 'probe',
  templateUrl: './probe.component.html',
  styleUrls: ['./probe.component.css']
})
export class ProbeComponent implements OnInit {

  @Input() babylon: BabylonRow;
  @ViewChild("matSlider", { static: false }) matSlider: MatSlider;
  public showSlider: boolean;
  public text: string;
  public leftMargin: string;
  private sliderActionCounter: number;
  private singleObservationIndicator: boolean;
  private leadingWhitespaces: string;
  private probePrefix: string = '// <Probe />';
  private replacementText: string;
  private sliderIndex: number;
  private backgroundTextElementId: string;
  private sliderTextFieldElementId: string;

  constructor(private babylonService: BabylonService, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.backgroundTextElementId = 'background'.concat(this.babylon.line.toString());
    this.sliderTextFieldElementId = 'sliderTextField'.concat(this.babylon.line.toString());
    this.sliderActionCounter = 0;
    this.showSlider = false;
    this.formatText();
    this.leftMargin = this.calculateLeftMargin().concat('px');
  }

  private formatText() {
    let spaces = '';
    let txt = '';
    Array.from(this.babylon.text).forEach(c => {
      if (c === ' ') {
        spaces = spaces.concat(' ');
      }
    });
    txt = this.babylon.text.trim();
    this.text = txt;
    this.babylon.text = txt;
    this.leadingWhitespaces = spaces;
  }

  public updateSliderLabel(value: any) {
    return value;
  }

  public displaySlider() {
    this.sliderActionCounter++;
    if (this.isSingleObservation()) {
      this.handleSingleObservation();
    } else {
      this.handleSlider();
    }
  }

  public onSliderChange(event: MatSliderChange) {
    const sliderValue: number = event.value;
    this.sliderIndex = sliderValue;
    this.updateTextArea(this.babylon.observedValues[sliderValue - 1], this.sliderTextFieldElementId);
  }

  public hideSlider() {
    let currentActionCounter = this.sliderActionCounter;
    setTimeout(() => {
      if (currentActionCounter === this.sliderActionCounter) {
        if (this.singleObservationIndicator && this.replacementText) {
          this.text = this.text.replace(this.replacementText, this.probePrefix);
        }
        this.showSlider = false;
      }
    }, 1000);
  }

  private restoreSlider() {
    if (!this.sliderIndex) {
      const initialValue: string = this.babylon.observedValues[0];
      this.setSliderValueText(initialValue);
    } else {
      const slider: MatSlider = this.matSlider;
      if (slider) {
        slider.value = this.sliderIndex;
        this.setSliderValueText(this.babylon.observedValues[this.sliderIndex - 1]);
      }
    }
  }

  private updateTextArea(text: string, textAreaId: string) {
    document.getElementById(textAreaId)!.innerHTML = text;
  }

  private handleSlider() {
    this.showSlider = true;
    this.restoreSlider();
  }

  private isSingleObservation(): boolean {
    return this.babylon.observedValues.length <= 1;
  }

  private handleSingleObservation() {
    this.singleObservationIndicator = true;
    this.showSlider = false;
    this.replacementText = this.babylon.observedValues[0];
    let diff = this.probePrefix.length - this.replacementText.length;
    for (let i = 0; i < diff; i++) {
      this.replacementText = this.replacementText.concat(' ');
    }
    this.text = this.text.replace(this.probePrefix, this.replacementText);
  }

  private setSliderValueText(text: string) {
    this.babylonService.waitForElement(this.sliderTextFieldElementId, text, function () {
      document.getElementById(arguments[0])!.innerHTML = arguments[1];
    });
  }

  private calculateLeftMargin(): string {
    const marginHelper = this.renderer.createElement('div');
    this.renderer.setProperty(marginHelper, 'id', 'marginHelper');
    this.renderer.addClass(marginHelper, 'marginHelperClass');
    const text = this.renderer.createText('0');
    this.renderer.appendChild(marginHelper, text);
    this.renderer.appendChild(document.body, marginHelper);

    const helper = document.getElementById('marginHelper');
    const width = helper.offsetWidth;

    this.renderer.removeChild(document.body, marginHelper);
    return (this.leadingWhitespaces.length * width).toString();
  }
}
