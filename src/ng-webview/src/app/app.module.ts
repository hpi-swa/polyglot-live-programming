import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BabylonianAnalysisComponent } from './component/babylonian-analysis/babylonian-analysis.component';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { CommunicationService } from './service/communication.service';
import { ExampleComponent } from './component/example/example.component';

@NgModule({
  declarations: [AppComponent, BabylonianAnalysisComponent, ExampleComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([], { useHash: true }),
    MatSliderModule,
    BrowserAnimationsModule
  ],
  providers: [CommunicationService],
  bootstrap: [AppComponent],
})
export class AppModule {}
