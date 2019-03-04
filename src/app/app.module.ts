import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule, ToastController } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { MyApp } from './app.component';
import { HomeComponent } from './../pages/home/home.page';
import { File } from '@ionic-native/file';
import { Media } from '@ionic-native/media';
import { MusicControls } from '@ionic-native/music-controls';
import { LoadMusicProvider } from './../providers/load-music/load-music';
import { PlayMusicProvider } from './../providers/play-music/play-music';
import { Diagnostic } from '@ionic-native/diagnostic';
import { NativeStorage } from '@ionic-native/native-storage';
import { FavoritesPage } from './../pages/favorites/favorites';
import { BackgroundMode } from '@ionic-native/background-mode';

@NgModule({
  declarations: [
    MyApp,
    HomeComponent,
    FavoritesPage
  ],
  entryComponents: [
    MyApp,
    HomeComponent,
    FavoritesPage
  ],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [
    IonicApp
  ],
  providers: [ 
    StatusBar, 
    SplashScreen, 
    {
      provide: ErrorHandler, 
      useClass: IonicErrorHandler
    },
    File,
    Media,
    MusicControls,
    PlayMusicProvider,
    LoadMusicProvider,
    Diagnostic,
    ToastController,
    NativeStorage,
    BackgroundMode
  ]
})
export class AppModule {}
