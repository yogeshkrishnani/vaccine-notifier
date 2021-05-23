import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field/';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MAT_TABS_CONFIG, MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { VaccineNotifierDashboardComponent } from './vaccine-notifier-dashboard.component';

@NgModule( {
  declarations : [
    VaccineNotifierDashboardComponent,
  ],
  exports : [
    VaccineNotifierDashboardComponent,
  ],
  imports : [
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatSliderModule,
    MatTabsModule,
    MatTableModule,
    MatToolbarModule,
    ReactiveFormsModule,
  ],
  providers : [
    { provide : MAT_TABS_CONFIG, useValue : { animationDuration : '0ms' } }
  ],
} )
export class VaccineNotifierDashboardModule {
}
