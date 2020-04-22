import { Component } from '@angular/core';
import { IonicPage, NavController, Platform, ModalController, ViewController } from 'ionic-angular';

import { ParentPage } from '../parent/parent';
import { StorageServiceProvider } from '../../providers/storage-service/storage-service';

/*
  Generated class for the LoginPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@IonicPage()
@Component({
  templateUrl: 'login.html',
  selector: 'page-login'
})
export class LoginPage extends ParentPage {

  data: any;
  challengeHandler: WL.Client.SecurityCheckChallengeHandler;
  stepUpChallengeHandler: WL.Client.SecurityCheckChallengeHandler;

  username: string;
  password: string;
  loginError: string;
  stepUpLoginError: string;
  loginInProgress: boolean;
  isChallenged: boolean;
  logger: any;

  constructor(public nav: NavController, private platform: Platform,
    public modalCtrl: ModalController,
    private _viewController: ViewController,
    private _storageService: StorageServiceProvider) {
    super("Login");

    this.isChallenged = false;
    this.username = "";
    this.password = "";
    this.loginError = "";
    this.loginInProgress = false;
    this.stepUpLoginError = "";
    this.logger = WL.Logger.create({ pkg: 'LoginPage' });

    // HACK: During debugging, the jsonstore.js is being loaded after initialization is completed, causing
    // a null pointer exception during JSONStore initialization.  
    setTimeout(() => {
      this._storageService.initializeOfflineStorage().then(
        (success) => {
          this.logger.log("LoginPage(): Offline storage initialized successfully.");
        },
        (error) => {
          this.logger.log("LoginPage(): Offline storage initialization failed.");
        }
      );

    }, 1000);

    this.challengeHandler = WL.Client.createSecurityCheckChallengeHandler("UserLoginSecurityCheck");
 
    this.challengeHandler.handleChallenge = (challenge: any) => {
      this.logger.log("Handling challenge: " + challenge);
      this.isChallenged = true;
      if (!this.nav.isActive(this._viewController)) {
        this.logger.log("Authentication required when not on login page");
        this.nav.popToRoot();
      }
      if (challenge.errorMsg) {
        this.loginError = challenge.errorMsg + " (Remaining attemps: " + challenge.remainingAttempts + ")";
        this.loginInProgress = false;
      }
    }
    this.challengeHandler.handleSuccess = (successData) => {
      this.logger.log("Challenge Handler completed successfully: successData = " + JSON.stringify(successData));
      if (this.loginInProgress) {
        this.nav.push('AppointmentsPage');
        this.isChallenged = false;
        this.loginInProgress = false;
      }
    }
    this.challengeHandler.handleFailure = (error) => {
      this.loginError = error.failure;
      this.isChallenged = false;
      this.loginInProgress = false;
    }


    this.stepUpChallengeHandler = WL.Client.createSecurityCheckChallengeHandler("StepUpSecurityCheck");
    let _stepUpChallengeHandler = this.stepUpChallengeHandler;
    this.stepUpChallengeHandler.handleChallenge = (challenge: any) => {
      if (challenge.question) {
        this.logger.debug("Handling step up challenge: %o" + challenge);
        let modal = this.modalCtrl.create('StepUpAuthenticationModalPage', { challenge: challenge });
        modal.onDidDismiss(answer => {
          if (answer) {
            challenge.answer = answer;
            _stepUpChallengeHandler.submitChallengeAnswer(challenge);
          } else {
            _stepUpChallengeHandler.cancel();
          }
        });

        modal.present();

      }
    }
    this.stepUpChallengeHandler.handleFailure = function (error) {
      this.stepUpLoginError = error.errorMsg;
    }
    this.stepUpChallengeHandler.handleSuccess = function (successData) {

    }

  }


  login() {
    this.loginInProgress = true;
    this.loginError = "";

    WL.Logger.updateConfigFromServer();

    this.logger.debug("Sign in clicked!");
    if (WL.Client.getEnvironment() === "preview") {
      this._storageService.initializeOfflineStorage().then(
        (success) => {
          this.nav.push('AppointmentsPage');
          this.loginInProgress = false;
        },
        (error) => {
          this.nav.push('AppointmentsPage');
          this.loginInProgress = false;
        }
      )
    } else {
      if (this.isChallenged) {
        this.challengeHandler.submitChallengeAnswer({ username: this.username, password: this.password });
      } else {
        WLAuthorizationManager.login("UserLoginSecurityCheck", { username: this.username, password: this.password })
          .then((userData) => {
            this.logger.log("LoginPage.login(): Login success. User data = " + userData);
          },
          (error) => {
            this.logger.log("LoginPage.login(): Login failed.");
          });
      }
    }

  }

  blurActiveInput() {
    if (!this.platform.is("iOS")) return;

    var activeElement: any = document.activeElement;
    if (activeElement.tagName == "INPUT" || activeElement.tagName == "TEXTAREA") {
      activeElement.blur();
    }
  }

}
