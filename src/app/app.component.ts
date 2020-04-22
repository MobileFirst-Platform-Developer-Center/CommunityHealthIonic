///<reference path="../../plugins/cordova-plugin-mfp/typings/worklight.d.ts"/>
///<reference path="../../plugins/cordova-plugin-mfp-jsonstore/typings/jsonstore.d.ts"/>
///<reference path="../../plugins/cordova-plugin-mfp-push/typings/mfppush.d.ts"/>

import { Component, Renderer } from '@angular/core';
import { Platform, App } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { Network } from '@ionic-native/network';
import { Dialogs } from '@ionic-native/dialogs';

import { StorageServiceProvider } from '../providers/storage-service/storage-service';

@Component({
  templateUrl: 'app.html'
})
export class CommunityHealthApp {

  private rootPage: any;
  private nav: any;

  constructor(platform: Platform, renderer: Renderer, private app: App, statusBar: StatusBar,
    private network: Network,
    private storageService: StorageServiceProvider,
    private dialogs: Dialogs) {

    renderer.listenGlobal("document", "mfpjsloaded", () => this.mfpInitializationComplete());

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      //statusBar.styleDefault();
      statusBar.overlaysWebView(true);
      statusBar.styleLightContent();

      // watch network for a disconnect
      let disconnectSubscription = this.network.onDisconnect().subscribe(() => {
        console.log('network was disconnected :-( ')
      });

      // watch network for a connection
      let connectSubscription = this.network.onConnect().subscribe(() => {
        console.log('network connected!');
        this.storageService.syncRequired().then(
          (syncRequired) => {
            console.debug("Evaluating sync status: " + syncRequired ? "SYNC REQUIRED" : "SYNC NOT REQUIRED");
            if (syncRequired) {
              this.storageService.synchronize().then(
                () => {
                  console.debug("Offline storage synchronzied successfully");
                  this.dialogs.alert("Synchronization from offline storage completed successfully.", "Synchronization Complete", "Ok");
                },
                (error) => {
                  console.error("An error occurred while syncronizing offline storage");
                }
              )
            }
          }
        )
        // We just got a connection but we need to wait briefly
        // before we determine the connection type.  Might need to wait
        // prior to doing any api requests as well.
        setTimeout(() => {
          console.log('network connnection is type: ' + this.network.type);
        });
      });

    });
  }

  ngAfterViewInit() {
    this.nav = this.app.getActiveNav();
  }

  mfpInitializationComplete() {
    console.log("MobileFirst Foundation initialized successfully.")
    this.rootPage = 'LoginPage';
    this.nav.push('LoginPage');   // hack

    WL.Logger.config({ capture: true });
    WL.Logger.config({ level: 'TRACE' });
    WL.Logger.config({ autoSendLogs: true });

    if (this.network.type != 'none' && this.network.type != 'unknown') {
      setInterval(function () {
        WL.Logger.send();
      }, 5000);
    }
    WL.Logger.updateConfigFromServer();

    //WL.Client.pinTrustedCertificatePublicKey('*au-sydmybluemixnet.cer').then(onSuccess, onFailure);
    function onSuccess() {
      //   alert("Certificate Pinned Successfully ");

    }
    function onFailure() {
      alert("Certificate pinning failed, Connect to Mobilefirst will not work");

    }

    // Connect to the server immediately to enable app management
    WLAuthorizationManager.obtainAccessToken().then(function () {
      MFPPush.initialize(
        function (successResponse) {
          console.log("MFP Push successfully intialized: " + JSON.stringify(successResponse));
          MFPPush.registerNotificationsCallback(function (content) {
            console.log("Push notification received: %o", content);
          });
          WLAuthorizationManager.obtainAccessToken("push.mobileclient").then(function () {
            MFPPush.registerDevice({ "phoneNumber": "" },
              function (successResponse) {
                console.log("MFP Push - Device successfully registered");
              },
              function (failureResponse) {
                console.log("MFP Push - Device failed to register: " + JSON.stringify(failureResponse));
              }
            );
          });
        },
        function (failureResponse) {
          console.log("MFP Basic Auth failed with error: " + JSON.stringify(failureResponse));

          //  alert("Your Application is Probable fake , Close and Uninstall immediately");
        }
      );
    });
  }

}

Array.prototype["findByProperty"] = function (property, value) {
  for (let i = 0; i < this.length; i++) {
    if (this[i][property] === value) {
      return this[i];
    }
  }
  return null;
}
Array.prototype["findById"] = function (id) {
  return this.findByProperty("id", id);
}
Array.prototype["replaceById"] = function (item, id) {
  return this.replaceByProperty(item, "id", id);
}
Array.prototype["replaceByProperty"] = function (item, property, value) {
  for (let i = 0; i < this.length; i++) {
    if (this[i][property] === value) {
      this.splice(i, 1, item);
    }
  }
}
