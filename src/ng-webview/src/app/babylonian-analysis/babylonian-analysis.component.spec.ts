import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BabylonianAnalysisComponent } from './babylonian-analysis.component';

describe('BabylonianAnalysisComponent', () => {
  let component: BabylonianAnalysisComponent;
  let fixture: ComponentFixture<BabylonianAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BabylonianAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BabylonianAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
