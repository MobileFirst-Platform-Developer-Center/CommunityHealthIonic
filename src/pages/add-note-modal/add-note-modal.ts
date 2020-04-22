import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';
import * as moment from 'moment';

/**
 * Generated class for the AddNoteModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-add-note-modal',
  templateUrl: 'add-note-modal.html',
})
export class AddNoteModalPage {
  appointmentNote: any = { id: new Date().getTime(), timestamp: moment().format("YYYY-MM-DD hh:mm:ss"), content: "" };
  appointment: any;
  _isDirty = false;

  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.appointment = this.navParams.get("appointment");
  }

  onChange(event) {
    this._isDirty = true;
  }

  isSaveDisabled() {
    return !this._isDirty;
  }

  save() {
    //    this.appointment.notes.push(this.appointmentNote);
    this.viewCtrl.dismiss(this.appointmentNote);
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

}
