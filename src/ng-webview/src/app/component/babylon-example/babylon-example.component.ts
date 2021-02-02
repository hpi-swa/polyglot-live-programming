import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { BabylonExample, BabylonRow } from 'src/app/model/babylon.model';

@Component({
  selector: 'babylon-example',
  templateUrl: './babylon-example.component.html',
  styleUrls: ['./babylon-example.component.css']
})
export class BabylonExampleComponent implements OnInit {

  @Input() babylonExample: BabylonExample;

  examples: {
    example: BabylonRow,
    selected: boolean,
    disabled: boolean
  }[];
  rows: BabylonRow[];
  selected: Array<string>;

  constructor() { }

  ngOnInit(): void {
    this.examples = new Array();
    this.babylonExample.examples.forEach((value, index) => {
      this.examples.push({
        example: value,
        selected: true,
        disabled: this.babylonExample.examples.length === 1
      });
    });
    this.updateSelected();
    this.rows = this.babylonExample.rows;
  }

  updateSelected() {
    this.selected = new Array();
    this.examples.forEach(value => {
      if (value.selected) {
        this.selected.push(value.example.examples[0].exampleName);
      }
    });
    if (this.selected.length === 1) {
      this.examples.forEach(value => {
        if (value.example.examples[0].exampleName === this.selected[0]) {
          value.disabled = true;
        }
      });
    } else {
      this.examples.forEach(value => {
        value.disabled = false;
      });
    }
  }

}
