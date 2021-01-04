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

  name: string;
  n: string;


  constructor(private babylonService: BabylonService) { }

  ngOnInit(): void {
    if (this.babylon.examples[0].exampleName) {
      this.name = this.babylon.examples[0].exampleName;
    }
    this.n = this.getInitalN();
  }

  private toText() {
    var exampleText = '// <Example';
    if (this.name) {
      exampleText = exampleText.concat('  :name="' + this.name + '" ');
    }
    return exampleText.concat(' n="' + this.n + '" />');
  }

  onChange(event: any) {
    this.n = event.target.value;
    this.updateResults();
  }

  onKey(event: any) {
    this.name = event.target.value;
    this.updateResults();
  }

  updateResults() {
    this.babylonService.updateResultMap(this.babylon.line, this.toText());
  }

  private getInitalN() {
    const startIndex = this.babylon.text.lastIndexOf('n="') + 3;
    const endIndex = this.babylon.text.indexOf('"', startIndex + 1);
    return this.babylon.text.substring(startIndex, endIndex);
  }
}
