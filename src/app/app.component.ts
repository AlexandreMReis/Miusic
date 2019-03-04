import { FavoritesPage } from './../pages/favorites/favorites';
import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomeComponent } from './../pages/home/home.page';
import { LoadMusicProvider } from './../providers/load-music/load-music';
import { BackgroundMode } from '@ionic-native/background-mode';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage:any = HomeComponent;
  pages: Array<{title: string, component: any}> = [
                                                    {title: 'My Music', component: HomeComponent},
                                                    {title: 'Favorites', component: FavoritesPage}
                                                  ];
  cordova: any;
  mediaTimer: NodeJS.Timer;

  constructor(
    public platform: Platform, 
    public statusBar: StatusBar, 
    public splashScreen: SplashScreen,
    public menu: MenuController,
    private loadMusicProvider: LoadMusicProvider,
    private backgroundMode: BackgroundMode
  ) {
    this.initializeApp();
  }
  
  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.show();
      this.splashScreen.hide();
      this.backgroundMode.enable();

      this.platform.registerBackButtonAction(() => {
        console.log("hardware back button clicked");
        if(this.nav.canGoBack()){
          //console.log("nav.pop() called");
          this.nav.pop();
        }else{
          //console.log("moveToBackground() called");
          this.backgroundMode.moveToBackground();
        }
      }, 1)

      this.loadMusicProvider.getSdCardDetails()
      .then(details => {
        if(details.length > 0){
          this.loadMusicProvider.hasSdCard=true
          this.loadMusicProvider.sdCardRootDirectory = details[0].filePath + '/';
          this.loadMusicProvider.loadMusicsFromNativeStorage().then(res=> {
            console.log("------------------ALL MUSICS FROM NATIVE STORAGE LOADED------------");
            console.log(res);
            this.loadMusicProvider.loadMusicsFromSdCardAndMemory(details)
            .then(res =>{
              console.log("------------------ALL MUSICS FROM EXTERNAL STORAGE LOADED------------");
              //this.loadMusicProvider.loadingMusics = false;
            })
          }).catch(rej=> {
            console.log(rej);
            this.loadMusicProvider.loadMusicsFromSdCardAndMemory(details)
            .then(res =>{
              console.log("------------------ALL MUSICS FROM EXTERNAL STORAGE LOADED------------")
             // this.loadMusicProvider.loadingMusics = false;
            })
          });
        }else{
          this.loadMusicProvider.loadingMusics.internMemory = true;
          this.loadMusicProvider.loadingMusics.sdCard = true;
          this.loadMusicProvider.sdCardRootDirectory = "noSdCard";
          this.loadMusicProvider.loadMusicsFromNativeStorage().then(res=> {
            console.log("------------------ALL MUSICS FROM NATIVE STORAGE LOADED------------");
            console.log(res);
            this.loadMusicProvider.loadMusicsFromSdCardAndMemory(details)
            .then(res =>{
              console.log("------------------ALL MUSICS FROM EXTERNAL STORAGE LOADED------------");
              //this.loadMusicProvider.loadingMusics = false;
            })
          }).catch(rej=> {
            console.log(rej);
            this.loadMusicProvider.loadMusicsFromSdCardAndMemory(details)
            .then(res =>{
              console.log("------------------ALL MUSICS FROM EXTERNAL STORAGE LOADED------------")
             // this.loadMusicProvider.loadingMusics = false;
            })
          });
        }
      })
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }
}
