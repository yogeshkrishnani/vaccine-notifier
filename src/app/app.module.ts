import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { VaccineNotifierDashboardModule } from './vaccine-notifier-dashboard/vaccine-notifier-dashboard.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule( {
  declarations : [
    AppComponent,
  ],
  imports : [
    BrowserModule,
    VaccineNotifierDashboardModule,
    BrowserAnimationsModule,
  ],
  providers : [],
  bootstrap : [ AppComponent ]
} )
export class AppModule {
}
