import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import 'rxjs/add/operator/map';
import { AdapterServiceProvider } from '../adapter-service/adapter-service';
import { StorageServiceProvider } from '../storage-service/storage-service';

/*
  Generated class for the AppointmentServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AppointmentServiceProvider {
  appointments: any;

  constructor(private _adapterService: AdapterServiceProvider, private _storageService: StorageServiceProvider, public network: Network) {
    this.appointments = [];
  }

  load(refreshFromServer: boolean = false) {
    if (this.appointments && this.appointments.length > 0 && !refreshFromServer) {
      // already loaded data
      return Promise.resolve(this.appointments);
    }

    // We don't have the data yet, or a forced refresh is requested    
    return new Promise((resolve, reject) => {
      if (this.network.type == 'none' || this.network.type == 'unknown') {
        // No network connection, so loading from local storage is the best we can do!
        this._storageService.loadFromOfflineStorage().then(
          (offlineAppointments) => {
            this.appointments = offlineAppointments;
            resolve(this.appointments);
          },
          (error) => {
            reject(error);
          }
        )
      } else {
        this._adapterService.callAdapter("Appointments", "appointments", "GET", null).then(
          (response) => {
            this.appointments = response;
            this._saveOffline(this.appointments, false).then(() => resolve(this.appointments), (error) => reject(error));
          },
          (error) => {
            reject(error);
          }
        );
      }
    });
  }

  // Save the appointments
  saveAll(appointments: any, localOnly: boolean = false) {
    return new Promise((resolve, reject) => {
      this.appointments = appointments;
      if (localOnly || this.network.type == 'none' || this.network.type == 'unknown') {
        this._saveOffline(appointments, true).then(() => resolve(), (error) => reject(error));
      } else {
        // Try to save to the server first
        this._adapterService.callAdapter("Appointments", "appointments", "POST", appointments).then(
          (response) => {
            this._saveOffline(appointments, false).then(() => resolve(), (error) => reject(error));
          },
          (adapterError) => {
            // Don't throw an error... but mark dirty since we were only able to save locally
            return this._saveOffline(this.appointments, true);
          }
        );
      }
    });
  }

  save(appointment: any, localOnly: boolean = false) {
    return new Promise((resolve, reject) => {
      this.appointments.replaceById(appointment, appointment.id);
      if (localOnly || this.network.type == 'none' || this.network.type == 'unknown') {
        this._saveOffline(appointment, true).then(() => resolve(), (error) => reject(error));
      } else {
        // Try to save to the server first
        this._adapterService.callAdapter("Appointments", "appointment/" + appointment.id, "PUT", appointment).then(
          (response) => {
            this._saveOffline(appointment, false).then(() => resolve(), (error) => reject(error));
          },
          (adapterError) => {
            // Don't throw an error... but mark dirty since we were only able to save locally
            return this._saveOffline(appointment, true);
          }
        );
      }
    });
  }

  _saveOffline(itemOrItems, markDirty) {
    return new Promise((resolve, reject) => {
      this._storageService.storeInOfflineStorage(itemOrItems, markDirty).then(
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        }
      )
    });
  }

}
