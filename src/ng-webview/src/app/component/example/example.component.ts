import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import {  BabylonRow } from 'src/app/model/babylon-row.model';
import { BabylonService } from 'src/app/service/babylon.service';

@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {

  @Input() babylon: BabylonRow;

  names: Array<string>;
  inputs: Map<string, string>;
  selected: string;


  constructor(private babylonService: BabylonService) { }

  ngOnInit(): void {
    this.names = new Array<string>();
    for(var i = 0; i < this.babylon.examples.length; i++) {
      this.names.push(this.babylon.examples[i].exampleName);
    }
    this.selected = this.names[0];
    console.log(this.selected);
    this.inputs = this.getInitalValues();
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
    console.log(event);
    event.target.value;
    //this.updateResults();
  }

  onKey(event: any) {
    console.log(event);
 //   this.name = event.target.value;
    //this.updateResults();
  }

  updateResults() {
    this.babylonService.updateResultMap(this.babylon.line, this.toText());
  }

  private getInitalValues() {
    var inputs = new Map<string, string>();
    const matches = this.babylon.text.match(/(:)*[^\s]+="[^\s]+"/g);
    console.log(matches);
    matches.forEach((match, index) => {
      const key = match.match(/(:)*[^\s]+=/g)[0].replace('=', '');
      const value = match.match(/[^="\s]+"/g)[0].replace('"', '');
      if(key !== ':name') {
        inputs.set(key, value);
      }
    });
    return inputs;
  }

  onSelectionChange(event: any) {
    console.log(this.selected);
  }
}
