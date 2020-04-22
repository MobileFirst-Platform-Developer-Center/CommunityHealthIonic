import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular'; 
import * as moment from 'moment';

/**
 * Generated class for the StepUpAuthenticationModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-step-up-authentication-modal',
  templateUrl: 'step-up-authentication-modal.html',
})
export class StepUpAuthenticationModalPage {
  
    challenge: any;
    appointmentNote: any = {id: new Date().getTime(), timestamp: moment().format("YYYY-MM-DD hh:mm:ss"), content: ""};
    appointment: any;
    answer: string = "";
    _isDirty = false;
      
    constructor(private viewCtrl: ViewController, navParams: NavParams) {
      this.challenge = navParams.get("challenge");
    }
    
    submitChallenge(){
      this.viewCtrl.dismiss(this.answer);
    }
    
    cancel() {
      this.viewCtrl.dismiss();
    }
}
