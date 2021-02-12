import { Input } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { BabylonRow } from 'src/app/model/babylon.model';
import { BabylonService } from 'src/app/service/babylon.service';

@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {

  @Input() babylon: BabylonRow;

  name: string;
  inputs: Map<string, string>;
  selected: string;
  result: string;


  constructor(private babylonService: BabylonService) { }

  ngOnInit(): void {
    this.name = this.babylon.examples[0].exampleName;
    this.inputs = this.getInitalValues();
    this.result = this.babylon.examples[0].observedValues[0].displayString;
  }

  private toText() {
    var exampleText = '// <Example';
    this.inputs.forEach((value, key) => {
      exampleText = exampleText.concat('  ' + key + '="' + value + '" ');
    });
    exampleText = exampleText.concat('  :name="' + this.name + '" ');
    return exampleText.concat(' />');
  }

  // input 
  onChange(event: any) {
    this.inputs.set(event.target.getAttribute('name'), event.target.value);
  }

  onKey(event: any) {
    this.inputs.set(event.target.getAttribute('name'), event.target.value);
  }

  onKeyName(event: any) {
    console.log("TODO:" + event.target.value);
  }
  
  onSubmit() {
    this.babylonService.updateResultMap(this.babylon.line, this.toText());
  }

  private getInitalValues(): Map<string, string> {
    var inputs = new Map<string, string>();
    const matches = this.babylon.text.match(/(:)*[^\s]+="[^\s]+"/g);
    matches.forEach((match, i) => {
      const key = match.match(/(:)*[^\s]+=/g)[0].replace('=', '');
      const value = match.match(/[^="\s]+"/g)[0].replace('"', '');
      if (key !== ':name') {
        inputs.set(key, value);
      }
    });
    return inputs;
  }

}
