import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ParentPage } from '../parent/parent';
import * as moment from 'moment';

@IonicPage()
@Component({
  selector: 'page-patient-detail',
  templateUrl: 'patient-detail.html',
})
export class PatientDetailPage extends ParentPage {
  appointment: any;
  activeTab: string = 'details';
  _isDirty: boolean = false;

  constructor(public nav: NavController, public navParams: NavParams) {

    super("PatientDetail");
    this.appointment = navParams.get("appointment");

    /* PUSH NOTIFICATION PAYLOADS TO SEND (silent);
    {
      "testId": "TEST-123",
      "submitted": "2016-05-09 11:12"
    }
                ... AND ...
    {
      "testId": "TEST-123",
      "received": "2016-05-09 11:12"
    }
    */

    var self = this;
    MFPPush.registerNotificationsCallback((content) => {
      console.log("PatientDetail: Push notification received: %o, appointment: %o", content, self.appointment);
      var msg = (content.alert && content.alert.body) ? JSON.parse(content.alert.body) : {};
      if (msg.testId) {
        for (var i = 0; i < self.appointment.tests.length; i++) {
          if (msg.testId == self.appointment.tests[i].id) {
            if (msg.submitted) {
              self.appointment.tests[i].submitted = msg.submitted;
            } else if (msg.received) {
              self.appointment.tests[i].received = msg.received;
            }
          }
        }
      }
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PatientDetailPage');
  }
  formatAppointmentTime(appointment) {
    return moment(appointment.scheduledTime).format("hh:mm a");
  }

  getPatientAge(patient: any) {
    return moment().diff(moment(patient.dob), "years");
  }

  getPatientLocationClass(appointment) {
    if (appointment.appointmentStatus == "WAITING") {
      return "waiting";
    } else if (appointment.appointmentStatus == "WAITING_IN_ROOM") {
      return "waitingInRoom";
    } else if (appointment.appointmentStatus == "IN_PROGRESS") {
      return "inProgress";
    }
  }

  formatVisitDate(visit) {
    return moment(visit.date).format("MMM DD, YYYY");
  }

  formatTestItemDate(dateStr) {
    if (!dateStr) {
      return "--";
    }
    return moment(dateStr).format("YYYY/MM/DD");
  }

  formatTestItemTime(dateStr) {
    if (!dateStr) {
      return " ";
    }
    return moment(dateStr).format("@ hh:mm a");
  }

  subscribeToTest(test) {
    WLAuthorizationManager.obtainAccessToken().then(function () {
      MFPPush.subscribe(["TEST-" + test.id],
        () => { console.log("Subscribed to tag TEST-" + test.id); },
        (error) => { console.log("Error subscribing to tag TEST-" + test.id + ": " + JSON.stringify(error)); }
      );
    });
  }

  isSaveDisabled() {
    return !this._isDirty;
  }

  onChange(event) {
    console.debug("onChange: event = %o", event);
    this._isDirty = true;
  }

  saveChanges() {
    this._isDirty = false;
    // Put this in the JSONStore and send to server if connected
  }

  setTab(newTab) {
    this.activeTab = newTab;
    WL.Analytics.log({ 'patientDetailsTab': newTab, 'clickId': new Date().getTime() });
    WL.Logger.warn("Sending analytics data for tab click: " + newTab);
  }

}
