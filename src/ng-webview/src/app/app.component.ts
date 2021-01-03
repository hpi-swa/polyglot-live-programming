import { Component, OnInit } from '@angular/core';
import { vscode } from 'src/constant';
import { CommunicationService } from './service/communication.service';
import { ScrollService } from './service/scroll.service';

@Component({
  selector: 'webview-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Hans';
  
  constructor(private communicationService: CommunicationService, private scrollService: ScrollService) { }

  ngOnInit() {
    this.communicationService.setMessagePoster(vscode);
  }

}
