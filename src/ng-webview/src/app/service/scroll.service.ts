import { Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { Scroll } from '@angular/router';
import { Observable } from 'rxjs';
import { CommunicationService } from './communication.service';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  private editorIsScrolling: boolean = false;
  private editorLine: number = 0;
  private background: string = " ";

  constructor(private eventManager: EventManager, private communicationService: CommunicationService) {
    this.eventManager.addGlobalEventListener('window', 'scroll', this.onScroll.bind(this));
    this.communicationService.editorLine.subscribe((value) => this.onEditorScroll(value));
    this.communicationService.background.subscribe((value) => this.background = value);
  }

  private onScroll(event: Scroll) {
    const floatLine = this.getEditorLineNumber();
    if (((this.editorLine - 0.7) <= floatLine && (this.editorLine + 0.7) >= floatLine) && this.editorIsScrolling) {
      this.editorIsScrolling = false;
    } else if (!this.editorIsScrolling) {
      const line = Math.ceil(floatLine);
      this.communicationService.postMessage({ scroll: line });
    }
  }

  private onEditorScroll(num: number) {
    this.editorLine = num;
    this.editorIsScrolling = true;
    const per = (num / this.countLines()) * 100;
    if (!isNaN(per)) {
      const nextPosition = document.body.scrollHeight * (per / 100);
      window.scroll(0, Math.ceil(nextPosition));
    }
  }

  private getEditorLineNumber() {
    const posPercentage = (document.scrollingElement.scrollTop / document.body.scrollHeight) * 100;
    const total = this.countLines();
    return (posPercentage / 100) * total;
  }

  private countLines() {
    var matches = this.background.match(/[^\n]*\n[^\n]*?/g);
    if (matches) {
      return matches.length;
    }
    return 0;
  }

  getEditorLine(): Observable<number> {
    return this.communicationService.editorLine.asObservable();
  }
}

