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
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import { ProbeComponent } from './component/probe/probe.component';
import { BabylonExampleComponent } from './component/babylon-example/babylon-example.component';
import {MatInputModule} from '@angular/material/input';




@NgModule({
  declarations: [AppComponent, BabylonianAnalysisComponent, ExampleComponent, ProbeComponent, BabylonExampleComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([], { useHash: true }),
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule
  ],
  providers: [CommunicationService],
  bootstrap: [AppComponent],
})
export class AppModule {}
