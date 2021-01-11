import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { BabylonRow } from 'src/app/model/babylon-row.model';
import { BabylonService } from 'src/app/service/babylon.service';

@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {

  @Input() babylon: BabylonRow;

  names: Array<string>;
  private _inputs: Map<string, Map<string, string>>;
  inputs: Map<string, string>;
  selected: string;
  result: string;


  constructor(private babylonService: BabylonService) { }

  ngOnInit(): void {
    this.names = new Array<string>();
    for (var i = 0; i < this.babylon.examples.length; i++) {
      this.names.push(this.babylon.examples[i].exampleName);
    }
    this.selected = this.names[0];
    this._inputs = this.getInitalValues(this.names);
    this.inputs = this._inputs.get(this.selected);
    this.setResult();
  }

  private setResult() {
    this.result = this.babylon.observedValues[0];
  }

  private toText() {
    var exampleText = '// <Example';
    this.inputs.forEach((value, key) => {
      exampleText = exampleText.concat('  ' + key + '="' + value + '" ');
    });
    if (this.names) {
      exampleText = exampleText.concat('  :name="' + this.names[0] + '" ');
    }
    return exampleText.concat(' />');
  }

  onChange(event: any) {
    this.inputs.set(event.target.getAttribute('name'), event.target.value); 
    this._inputs.set(this.selected, this.inputs);
  }

  onKey(event: any) {
    this.inputs.set(event.target.getAttribute('name'), event.target.value); 
    this._inputs.set(this.selected, this.inputs);
  }

  updateResults() {
    this.babylonService.updateResultMap(this.babylon.line + this.names.indexOf(this.selected), this.toText());
    this.setResult();
  }

  private getInitalValues(names: Array<string>) {
    var examplesInput = new Map<string, Map<string, string>>();
    this.babylon.text.split("\n").forEach((value, index) => {
      if(index >= names.length) {
        return;
      }
      var inputs = new Map<string, string>();
      const matches = value.match(/(:)*[^\s]+="[^\s]+"/g);
      matches.forEach((match, i) => {
        const key = match.match(/(:)*[^\s]+=/g)[0].replace('=', '');
        const value = match.match(/[^="\s]+"/g)[0].replace('"', '');
        if (key !== ':name') {
          inputs.set(key, value);
        }
      });
      examplesInput.set(names[index], inputs);
    });
    return examplesInput;
  }

  onSelectionChange(event: any) {
    this.inputs = this._inputs.get(this.selected);
  }

  onSubmit() {
    this.updateResults();
  }
}
