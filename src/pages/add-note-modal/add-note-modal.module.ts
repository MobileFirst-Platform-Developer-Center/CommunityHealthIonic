import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddNoteModalPage } from './add-note-modal';

@NgModule({
  declarations: [
    AddNoteModalPage,
  ],
  imports: [
    IonicPageModule.forChild(AddNoteModalPage),
  ],
})
export class AddNoteModalPageModule {}
