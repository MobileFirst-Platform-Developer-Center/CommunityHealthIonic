import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Network } from '@ionic-native/network';
import { Dialogs } from '@ionic-native/dialogs';

import { CommunityHealthApp } from './app.component';
import { AdapterServiceProvider } from '../providers/adapter-service/adapter-service';
import { AppointmentServiceProvider } from '../providers/appointment-service/appointment-service';
import { StorageServiceProvider } from '../providers/storage-service/storage-service';

@NgModule({
  declarations: [
    CommunityHealthApp
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(CommunityHealthApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    CommunityHealthApp
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    Network,
    Dialogs,
    AdapterServiceProvider,
    AppointmentServiceProvider,
    StorageServiceProvider
  ]
})
export class AppModule {}
