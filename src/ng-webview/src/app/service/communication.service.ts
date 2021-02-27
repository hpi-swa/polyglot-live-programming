/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

import { Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { MessagePoster } from 'src/constant';
import { AbstractProbe } from '../../../../babylonianAnalysisTypes';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  abstractProbes: BehaviorSubject<Array<AbstractProbe>>;
  background: BehaviorSubject<string>;
  editorLine: BehaviorSubject<number>;
  private editorConfig: BehaviorSubject<Array<string>>;

  private vscode: MessagePoster;

  constructor(private eventManager: EventManager) {
    this.eventManager.addGlobalEventListener('window', 'message', this.onMessage.bind(this));
    this.abstractProbes = new BehaviorSubject<Array<AbstractProbe>>(new Array());
    this.background = new BehaviorSubject<string>(" ");
    this.editorLine = new BehaviorSubject<number>(0);
    this.editorConfig = new BehaviorSubject<Array<string>>(new Array());
  }

  public setMessagePoster(messagePoster: any) {
    this.vscode = messagePoster;
  }

  private async onMessage(event) {
    const message = event.data;
    if (message.background) {
      this.background.next(message.background);
    }
    if (message.result) {
      this.abstractProbes.next(message.result);
    }
    if (message.editorConfig) {
      this.editorConfig.next(message.editorConfig);
    }
    if (message.scroll) {
      var lineNum = Number(message.scroll[0][0].line);
      this.editorLine.next(lineNum);
    }
  }

  postMessage(body: object) {
    this.vscode.postMessage(body);
  }

  getAbstractProbes(): Observable<Array<AbstractProbe>> {
    return this.abstractProbes.asObservable();
  }

  getBackground(): Observable<string> {
    return this.background.asObservable();
  }

  getEditorConfig(): Observable<Array<string>> {
    return this.editorConfig.asObservable();
  }
}
