import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StepUpAuthenticationModalPage } from './step-up-authentication-modal';

@NgModule({
  declarations: [
    StepUpAuthenticationModalPage,
  ],
  imports: [
    IonicPageModule.forChild(StepUpAuthenticationModalPage),
  ],
})
export class StepUpAuthenticationModalPageModule {}
