import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BabylonianAnalysisComponent } from './babylonian-analysis/babylonian-analysis.component';
import { HeaderComponent } from './header/header.component';

@NgModule({
  declarations: [AppComponent, BabylonianAnalysisComponent, HeaderComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([], { useHash: true }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
