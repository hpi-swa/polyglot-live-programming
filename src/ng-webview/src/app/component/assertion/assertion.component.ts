/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { Renderer2 } from '@angular/core';
import { Input, OnChanges, SimpleChanges } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { BabylonRow } from 'src/app/model/babylon.model';
import { SelectedExampleWrapper } from 'src/app/model/helper.model';
import { BabylonService } from 'src/app/service/babylon.service';
import { ExampleResult } from '../../../../../babylonianAnalysisTypes';

@Component({
  selector: 'assertion',
  templateUrl: './assertion.component.html',
  styleUrls: ['./assertion.component.css']
})
export class AssertionComponent implements OnChanges, OnInit {

  @Input() babylon: BabylonRow;

  @Input() selectedExamples: Array<SelectedExampleWrapper>;

  private initialized = false;

  private _observedValues: Map<string, string>;

  public selectedValues: Map<string, string>;
  public leadingWhitespaces: string;
  public leftMargin: string;

  constructor(private renderer: Renderer2, private babylonService: BabylonService) { }

  ngOnInit(): void {
    this.formatText();
    this.leftMargin = this.calculateLeftMargin().concat('px');
    this._observedValues = this.extractObservedValues();
    this.selectExamples();
    this.initialized = true;
  }

  public getFontStyles() {
    return this.babylonService.styleMap;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized) {
      if (changes.selectedExamples) {
        this.selectedExamples = changes.selectedExamples.currentValue;
        this.selectExamples();
      }
    }
  }

  public getColor(key: string) {
    const example = this.selectedExamples.find(e => e.name === key);
    if (example) {
      return example.color;
    }
    return "black";
  }

  private selectExamples() {
    this.selectedValues = new Map<string, string>();
    this._observedValues.forEach((value: string, key: string) => {
      if (SelectedExampleWrapper.inSelectedExample(this.selectedExamples, key)) {
        this.selectedValues.set(key, value);
      }
    });
  }

  private extractObservedValues(): Map<string, string> {
    const map = new Map<string, string>();
    if (this.babylon.examples && this.babylon.examples.length > 0) {
      let exampleResult: ExampleResult;
      for (exampleResult of this.babylon.examples) {
        map.set(exampleResult.exampleName, exampleResult.observedValues[0].displayString);
      }
    }
    return map;
  }

  private calculateLeftMargin(): string {
    const marginHelper = this.renderer.createElement('div');
    this.renderer.setProperty(marginHelper, 'id', 'marginHelper_assert');
    this.renderer.addClass(marginHelper, 'marginHelperClass_assert');
    const text = this.renderer.createText('0');
    this.renderer.appendChild(marginHelper, text);
    this.renderer.appendChild(document.head, marginHelper);

    const helper = document.getElementById('marginHelper_assert');
    const width = helper.offsetWidth;

    this.renderer.removeChild(document.body, marginHelper);
    return (this.leadingWhitespaces.length * width).toString();
  }

  private formatText() {
    let spaces = '';
    let txt = '';
    for (let el of Array.from(this.babylon.text)) {
      if (el !== ' ') {
        break;
      }
      spaces = spaces.concat(' ');
    }

    txt = this.babylon.text.trim();
    this.leadingWhitespaces = spaces;
  }
}


