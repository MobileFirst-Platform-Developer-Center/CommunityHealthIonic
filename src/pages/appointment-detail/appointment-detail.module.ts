import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AppointmentDetailPage } from './appointment-detail';

@NgModule({
  declarations: [
    AppointmentDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(AppointmentDetailPage),
  ],
})
export class AppointmentDetailPageModule {}
