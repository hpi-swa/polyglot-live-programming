import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { BabylonExample, BabylonRow } from 'src/app/model/babylon.model';
import { Example, SelectedExampleWrapper } from 'src/app/model/helper.model';

@Component({
  selector: 'babylon-example',
  templateUrl: './babylon-example.component.html',
  styleUrls: ['./babylon-example.component.css']
})
export class BabylonExampleComponent implements OnInit {

  @Input() babylonExample: BabylonExample;

  public _selected: Map<string, SelectedExampleWrapper>;

  public examples: Array<Example>;
  public rows: BabylonRow[];
  public selected: Array<SelectedExampleWrapper>;

  constructor() { }

  ngOnInit(): void {
    this.examples = new Array();
    this.babylonExample.examples.forEach((value, index) => {
      this.examples.push({
        example: value,
        selected: true,
        disabled: this.babylonExample.examples.length === 1,
        color: this.generateColor()
      });
    });
    this.createSelected();
    this.updateSelected();
    this.rows = this.babylonExample.rows;
  }

  updateSelected() {
    this.selected = new Array();
    this.examples.forEach(value => {
      if (value.selected) {
        const exampleName = value.example.examples[0].exampleName;
        this.selected.push(this._selected.get(exampleName));
      }
    });
    if (this.selected.length === 1) {
      this.examples.forEach(value => {
        if (value.example.examples[0].exampleName === this.selected[0].name) {
          value.disabled = true;
        }
      });
    } else {
      this.examples.forEach(value => {
        value.disabled = false;
      });
    }
  }

  public getColor(key: string) {
    return this._selected.get(key).color;
  }

  private createSelected() {
    this._selected = new Map();
    this.examples.forEach((value: Example, index: number) => {
      const exampleName = value.example.examples[0].exampleName;
      this._selected.set(exampleName, {
        name: exampleName,
        color: value.color
      });
    });
  }

  // TODO: Matching color model
  private generateColor() {
    return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
  }

}
