import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PatientDetailPage } from './patient-detail';

@NgModule({
  declarations: [
    PatientDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(PatientDetailPage),
  ],
})
export class PatientDetailPageModule {}
