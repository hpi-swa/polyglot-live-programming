/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BabylonExampleComponent } from './babylon-example.component';

describe('BabylonExampleComponent', () => {
  let component: BabylonExampleComponent;
  let fixture: ComponentFixture<BabylonExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BabylonExampleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BabylonExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
