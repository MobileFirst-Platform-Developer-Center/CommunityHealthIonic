import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { ParentPage } from '../parent/parent';
import { AppointmentServiceProvider } from '../../providers/appointment-service/appointment-service';
import * as moment from "moment";

/**
 * Generated class for the AppointmentsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-appointments',
  templateUrl: 'appointments.html',
})
export class AppointmentsPage extends ParentPage {

  appointments: any;
  _refresher: any;
  loading: boolean = true;
  loadingError: string = "";

  constructor(private _nav: NavController, private _appointmentService: AppointmentServiceProvider) {
    super("Appointments");
  }

  ionViewDidLoad() {
    console.log('--> ionViewDidLoad: Appointments page');
  }

  ionViewDidEnter() {
    console.log('--> ionViewDidEnter: Appointments page');
    this.onPageDidEnter(true);
  }

  needsDivider(appointment) {
    let index = this.appointments.indexOf(appointment);
    if (index === -1) {
      return false;
    } else if (index === 0) {
      return true;
    }
    return !moment(appointment.scheduledTime).isSame(this.appointments[index - 1].scheduledTime, "day");
  }

  formatDividerDate() {
    // let isToday = moment().isSame(appointment.scheduledTime, "day");
    // return (isToday ? "Today - " : "") + moment(appointment.scheduledTime).format("dddd, MMMM Do");
    return "Today - " + moment().format("dddd, MMMM Do");
  }

  formatAppointmentTime(appointment) {
    return moment(appointment.scheduledTime).format("hh:mm a");
  }

  openAppointmentDetails(appointment) {
    this._nav.push('AppointmentDetailPage', { appointment: appointment });
  }

  logout() {
    if (WL.Client.getEnvironment() === "preview") {
      this._nav.popToRoot()
    } else {
      WLAuthorizationManager.logout("UserLoginSecurityCheck").then(() => this._nav.popToRoot());
    }
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

  doRefresh(refresher) {
    this.appointments = [];
    this._refresher = refresher;
    this.onPageDidEnter(true);
  }

  onPageDidEnter(hideSpinner: boolean = false) {
    super.onPageDidEnter();
    console.log('--> onPageDidEnter: Appointments page');

    if (!hideSpinner) {
      this.loading = true;
    }
    this.loadingError = "";

    // Force reload from server when we're coming from the login page (for demo purposes, we can refresh the content)
    this._appointmentService.load(ParentPage.fromPage == "Login" ? true : false).then(
      (appointments) => {
        this.appointments = appointments;
        this.loading = false;
        this.loadingError = "";
        if (this._refresher) {
          this._refresher.complete();
          this._refresher = null;
        }
      },
      (error) => {
        this.loading = false;
        this.loadingError = "Something went wrong loading the list of appointments. Sorry! :(";
      }
    )
  }

}
