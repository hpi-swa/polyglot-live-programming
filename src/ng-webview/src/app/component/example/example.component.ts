import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { BabylonRow } from 'src/app/model/babylon-row.model';

@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {

  @Input() babylon: BabylonRow;

  constructor() { }

  ngOnInit(): void {
  }

  private toText() {
    return '// <Example :name="five" n="5" />';
  }

}
