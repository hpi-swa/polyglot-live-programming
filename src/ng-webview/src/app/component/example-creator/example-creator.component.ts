/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { AfterViewInit, Input } from '@angular/core';
import { ViewChild } from '@angular/core';
import { TemplateRef } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';
import { CommunicationService } from 'src/app/service/communication.service';

@Component({
  selector: 'example-creator',
  templateUrl: './example-creator.component.html',
  styleUrls: ['./example-creator.component.css']
})
export class ExampleCreatorComponent implements AfterViewInit, OnDestroy {
  @ViewChild(TemplateRef) _dialogTemplate: TemplateRef<any>;
  private _overlayRef: OverlayRef;
  private _portal: TemplatePortal;
  @Input() lineNr: number;

  constructor(private _overlay: Overlay, private _viewContainerRef: ViewContainerRef, private communicationService: CommunicationService) { }

  ngAfterViewInit(): void {
    this._portal = new TemplatePortal(this._dialogTemplate, this._viewContainerRef);
    this._overlayRef = this._overlay.create({
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true
    });
    this._overlayRef.backdropClick().subscribe(() => this._overlayRef.detach());
  }
  ngOnDestroy(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  openDialog() {
    this._overlayRef.attach(this._portal);
  }

  onSubmit(value: any) {
    this.communicationService.postMessage({
      lineNr: this.lineNr,
      name: value.name,
      value: value.value
    });
  }

}
