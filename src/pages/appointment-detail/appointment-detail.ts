import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { Dialogs } from '@ionic-native/dialogs';
import { ParentPage } from '../parent/parent';
import { AdapterServiceProvider } from '../../providers/adapter-service/adapter-service';
import { StorageServiceProvider } from '../../providers/storage-service/storage-service';
import { AppointmentServiceProvider } from '../../providers/appointment-service/appointment-service';
import * as moment from 'moment';

/**
 * Generated class for the AppointmentDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-appointment-detail',
  templateUrl: 'appointment-detail.html',
})
export class AppointmentDetailPage extends ParentPage {
  appointment: any;
  appointmentDuration: number;
  inProgressInterval: any;
  suspendedInterval: any;
  isDirty: boolean = false;

  constructor(
    public nav: NavController, 
    public navParams: NavParams, 
    public dialogs: Dialogs, 
    private modalCtrl: ModalController,
    private _adapterService: AdapterServiceProvider,
    private _storageService: StorageServiceProvider,
    private _appointmentService: AppointmentServiceProvider) {

    super("AppointmentDetail");

    this.appointment = navParams.get("appointment");
    this._storageService.syncRequired().then(
      (syncRequired) => {
        this.isDirty = syncRequired;
      }
    )
    var self = this;
    this._storageService.watchSyncState().subscribe(
      (isDirty) => {
        self.isDirty = isDirty;
      }
    );

  }

  formatAppointmentTime(appointment){
    return moment(appointment.scheduledTime).format("hh:mm a");
  }
  
  getPatientAge(patient:any){
    return moment().diff(moment(patient.dob), "years");
  }
  
  getPatientLocationClass(appointment) {
    if (appointment.appointmentStatus == "WAITING"){
      return "waiting";
    } else if (appointment.appointmentStatus == "WAITING_IN_ROOM"){
      return "waitingInRoom";
    } else if (appointment.appointmentStatus == "IN_PROGRESS"){
      return "inProgress";
    }
  }  
  
  formatNoteTimestamp(note){
    return moment(note.timestamp).format("MMM DD, YYYY @ hh:mm a");
  }
  
  formatWaitTime(){
    return this.appointment.waitTime;
  }

  formatAppointmentDuration(){
    if (this.appointment.endTime){
      this.appointmentDuration = moment(this.appointment.endTime).diff(this.appointment.startTime, "seconds") - this.appointment.suspendDuration;
    }
    return this.appointmentDuration 
            ? this.pad(moment.duration(this.appointmentDuration, "seconds").minutes(), 2) + ":" + this.pad(moment.duration(this.appointmentDuration, "seconds").seconds(), 2)
            : "--:--";
  }
  
  pad(str, length){
    str += "";
    while (str.length < length){
      str = "0" + str;
    } 
    return str;
  }
  
  beginAppointment(){
    this.appointment.startTime = moment().format("YYYY-MM-DD hh:mm:ss");
    this.appointment.suspendDuration = 0;
    this.resumeAppointment();
  }
  
  suspendAppointment(){
    clearInterval(this.inProgressInterval);
    this.appointment.appointmentStatus = "SUSPENDED";
    let __this = this;
    this.suspendedInterval = setInterval(() => {
      __this.appointment.suspendDuration += 1;
    }, 1000);
  }
  
  resumeAppointment(){
    if (this.suspendedInterval){
      clearInterval(this.suspendedInterval);
      this.suspendedInterval = null; 
    }
    this.appointment.appointmentStatus = "IN_PROGRESS";
    let __this = this;
    this.inProgressInterval = setInterval(() => {
      __this.appointmentDuration = moment.duration(moment().diff(moment(__this.appointment.startTime), "seconds"), "seconds").asSeconds() - __this.appointment.suspendDuration;  
    }, 1000)    
  }
  
  finishAppointment(){
    if (this.inProgressInterval){
      clearInterval(this.inProgressInterval);
    }
    if (this.suspendedInterval){
      clearInterval(this.suspendedInterval);
    }
    
    this.appointment.endTime = moment().format("YYYY-MM-DD hh:mm:ss");
    this.appointment.appointmentStatus = "COMPLETED";
    this._appointmentService.save(this.appointment).then(
      ()=>{}, (error)=>{WL.Logger.error("Failed to save appointment: " + error)});
    
    WL.Analytics.log({
      doctor: this.appointment.doctorId, 
      appointmentFinished: 1, 
      patientName: this.appointment.patient.name, 
      durationInMinutes: this.appointmentDuration / 60
    });
    WL.Analytics.send();
  }
  
  addTest(){
    // Call the adapter methods that will invoke step-up authentication
    var newTest = {
          type: "Comprehensive Metabolic Panel",
          ordered: moment().format("YYYY-MM-DD hh:mm")
        };
    this._adapterService.callAdapter("Appointments", "appointments/" + this.appointment.id + "/tests", "POST", JSON.stringify(newTest)).then(
      (response) => {
        this.appointment.tests.push(newTest);
        this.dialogs.alert("New Comprehensive Metabolic Panel scheduled.", "Order Complete", "Done").then(
          (success) => {
            this._appointmentService.save(this.appointment, false);
          }, 
          (error) => {
            console.error("Failed to open dialog: error = %o", error);
          }
        );
      },
      (error) => {
        this.dialogs.alert("Test could not be scheduled", "Authentication Failure", "OK");
      }
    );    
    
  }

  addMedication(){
    // Call the adapter methods that will invoke step-up authentication
    var newMedication = {
          name: "Tylenol",
          purpose: "Patient is using to tream persistent pain"
        };
    this._adapterService.callAdapter("Appointments", "appointments/" + this.appointment.id + "/medications", "POST", JSON.stringify(newMedication)).then( 
      (response) => {
        this.appointment.medications.push(newMedication);
        this.dialogs.alert("New Medication Added: Tylenol.", "Medication Added", "Done").then(
          (success) => {
            this._appointmentService.save(this.appointment, false);
          }, 
          (error) => {
            console.error("Failed to open dialog: error = %o", error);
          }
        );
      },
      (error) => {
        this.dialogs.alert("Medication not be scheduled", "Authentication Failure", "OK");
      }
    );    
    
  }
  
  addNote(){
    let modal = this.modalCtrl.create('AddNoteModalPage', {appointment: this.appointment});
    modal.onDidDismiss(newNote => {
      if (newNote){
        this.appointment.notes.push(newNote);
        this._appointmentService.save(this.appointment, false).then(
          (success) => {
            console.log("Successfully saved patient note");
          }, 
          (error) => {
            console.log("Failed to save patient note");
          }
        )
      }
    });
    modal.present();
  }
  
  
  openPatientDetails() {
    this.nav.push('PatientDetailPage', {appointment: this.appointment});
  }

}
