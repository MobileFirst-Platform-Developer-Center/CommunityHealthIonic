import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { AdapterServiceProvider } from '../adapter-service/adapter-service';
import 'rxjs/add/operator/map';

/*
  Generated class for the StorageServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class StorageServiceProvider {

  observable: Observable<boolean>;
  observer: Observer<boolean>;


  constructor(private _adapterService: AdapterServiceProvider) {
    this.observable = Observable.create(
      (observer) => {
        this.observer = observer
      }
    );
  }

  initializeOfflineStorage() {
    // Initialize the offline storage
    var collections = { appointments: { searchFields: { id: 'integer' } } };
    var __this = this;
    return WL.JSONStore.init(collections).then(
      (collections) => {
        console.log("Offline storage initialized successfully");
        __this.syncRequired().then(
          (syncRequired) => {
            console.debug(syncRequired ? "SYNC REQUIRED" : "SYNC NOT REQUIRED");
          }
        )
      },
      (error) => {
        console.error("Failed to initalize offline storage");
      }
    );
  }

  loadFromOfflineStorage(): WLPromise {
    return WL.JSONStore.get("appointments").findAll({}).then(
      (results: any) => {
        console.log("Successfully retrieved appointments from offline storage: %o", results);
        let appointments = [];
        for (var i = 0; i < results.length; i++) {
          appointments.push(results[i].json);
        }
        return appointments;
      },
      (error) => {
        console.error("Failed to retrieve appointments from offline storage");
      }
    )
  }

  storeInOfflineStorage(appointments: any, markDirty: boolean): WLPromise {
    let query = appointments.id ? { id: appointments.id } : {};
    return WL.JSONStore.get("appointments").remove(query, { markDirty: markDirty }).then(
      (numDocsRemoved) => {
        console.log("Successfully removed " + numDocsRemoved + " documents from offline storage");
        return WL.JSONStore.get("appointments").add(appointments, { markDirty: markDirty }).then(
          () => {
            console.log("Successfully replaced appointments in offline storage.");
            if (markDirty) {
              this.observer.next(true);
            }
          },
          (error) => console.error("Error replacing appointments in offline storage: " + JSON.stringify(error))
        );
      },
      (error) => console.error("Error removing appointments from offline storage: " + JSON.stringify(error))
    );
  }

  syncRequired() {
    return WL.JSONStore.get("appointments").getAllDirty({}).then(
      (dirtyDocuments) => {
        console.debug("Dirty documents: " + dirtyDocuments.length);
        return (!!dirtyDocuments && dirtyDocuments.length > 0);
      },
      (error) => {
        console.error("An error occurred retrieving the dirty documents from offline storage");
        return false;
      }
    )
  }

  watchSyncState(): Observable<boolean> {
    return this.observable;
  }

  synchronize() {
    return new Promise(
      (resolve, reject) => {
        this.loadFromOfflineStorage().then(
          (appointments) => {
            this._adapterService.callAdapter("Appointments", "appointments", "PUT", JSON.stringify(appointments))
              .then(response => {
                WL.JSONStore.get("appointments").getAllDirty({}).then(
                  (dirtyDocuments) => {
                    WL.JSONStore.get("appointments").markClean(dirtyDocuments, {}).then(
                      () => {
                        console.debug("Synchronization complete.");
                        this.observer.next(false);
                        resolve();
                      },
                      (error) => {
                        console.error("An error occurred while marking the dirty documents clean");
                        reject(error);
                      }
                    );
                  },
                  (error) => {
                    console.error("An error occurred while getting the dirty documents to mark clean");
                    reject();
                    return false;
                  }
                )
              });
          },
          (error) => {
            console.error("An error occurred while synchronizing the appointments to the server");
            reject();
          }
        )

      }
    )
  }

}
