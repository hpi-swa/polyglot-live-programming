/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { Input, OnChanges, SimpleChanges } from '@angular/core';
import { Component } from '@angular/core';
import { BabylonRow } from 'src/app/model/babylon.model';
import { BabylonService } from 'src/app/service/babylon.service';

@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnChanges {

  @Input() babylon: BabylonRow;

  @Input() color: string;

  name: string;
  inputs: Map<string, string>;
  selected: string;
  result: string;
  lineNr: number;

  babylonTest: BabylonRow;


  constructor(private babylonService: BabylonService) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.babylon) {
      this.babylonTest = changes.babylon.currentValue;
      this.lineNr = this.babylonTest.line;
      this.name = this.babylonTest.examples[0].exampleName;
      this.inputs = this.getInitalValues();
      this.result = this.babylonTest.examples[0].observedValues[0].displayString;
    }

  }

  private toText() {
    var exampleText = '// <Example';
    exampleText = exampleText.concat(' :name="' + this.name + '" ');
    this.inputs.forEach((value, key) => {
      exampleText = exampleText.concat(key + '="' + value + '"');
    });
    return exampleText.concat(' />');
  }

  // number value filed 
  public onChange(event: any) {
    this.inputs.set(event.target.getAttribute('name'), event.target.value);
  }
  // number value filed 
  public onKey(event: any) {
    this.inputs.set(event.target.getAttribute('name'), event.target.value);
  }

  public onSubmit() {
    this.babylonService.updateResultMap(this.babylon.line, this.toText());
  }

  private getInitalValues(): Map<string, string> {
    var inputs = new Map<string, string>();
    const matches = this.babylon.text.match(/(:)*[^(\"|\'|\s)]+=(\"|\')[^(\"|\')]+(\"|\')/g);
    matches.forEach((match, i) => {
      const key = match.match(/(:)*[^(\"|\'|\s)]+=/g)[0].split('=').join("");
      const value = match.match(/(\"|\')[^(\"|\')]+(\"|\')/g)[0].split('"').join("").split("'").join("");
      if (key !== ':name') {
        inputs.set(key, value);
      }
    });
    return inputs;
  }

  public getFontStyles() {
    return this.babylonService.styleMap;
  }

}
