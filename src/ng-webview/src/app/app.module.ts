import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BabylonianAnalysisComponent } from './component/babylonian-analysis/babylonian-analysis.component';
import { MatSliderModule } from '@angular/material/slider';
import {MatSelectModule} from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { CommunicationService } from './service/communication.service';
import { ExampleComponent } from './component/example/example.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';




@NgModule({
  declarations: [AppComponent, BabylonianAnalysisComponent, ExampleComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([], { useHash: true }),
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatIconModule
  ],
  providers: [CommunicationService],
  bootstrap: [AppComponent],
})
export class AppModule {}
