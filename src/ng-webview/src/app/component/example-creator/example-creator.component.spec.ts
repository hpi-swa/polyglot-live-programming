import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleCreatorComponent } from './example-creator.component';

describe('ExampleCreatorComponent', () => {
  let component: ExampleCreatorComponent;
  let fixture: ComponentFixture<ExampleCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExampleCreatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExampleCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
