import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BabylonianAnalysisComponent } from './babylonian-analysis/babylonian-analysis.component';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 

@NgModule({
  declarations: [AppComponent, BabylonianAnalysisComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([], { useHash: true }),
    MatSliderModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
