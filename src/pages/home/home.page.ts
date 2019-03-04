import { NavController, Platform } from 'ionic-angular';
import { Component, OnInit} from '@angular/core';

import { IMusic } from './../../interfaces/IMusic.interface';
import { PlayMusicProvider } from './../../providers/play-music/play-music';
import { LoadMusicProvider } from './../../providers/load-music/load-music';
import { IMusicPlaying } from './../../interfaces/IMusicPlaying';
import { BackgroundMode } from '@ionic-native/background-mode';
import { AlertController } from 'ionic-angular';
@Component({
  selector: 'mp-hc',
  templateUrl: './home.page.html'
})

export class HomeComponent implements OnInit{
  library: string = 'artists';
  albumPage: string;
  artistPage: string;
  searchPage: string;
  favoritesPage: string;
  alertShown : boolean = false;
  
  constructor(private navCtrl: NavController,
              public playMusicProvider: PlayMusicProvider,
              public loadMusicProvider: LoadMusicProvider,
              private platform: Platform,
              private backgroundMode: BackgroundMode,
              private alertController: AlertController
              ) {
  }

  ngOnInit(){
    console.log("Loading musics from memory Music Directory...");
    this.albumPage = 'AlbumPage';
    this.artistPage = 'ArtistPage';
    this.searchPage = 'SearchPage';
    this.favoritesPage = 'FavoritesPage';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
  }

  musicClicked(musicArg: IMusic, musicIndex: number){
    let preMusicPlaying: IMusicPlaying = {
      music: musicArg,
      musicIndex: musicIndex,
      musicsList: this.loadMusicProvider.musics
    }
    this.playMusicProvider.musicClicked(preMusicPlaying);
  }

  chooseAlbum(albumArg: string){
    //this.platform.ba
    this.navCtrl.push(this.albumPage, {
      album: albumArg
    })
  }

  chooseArtist(artistArg: string){
    this.navCtrl.push(this.artistPage, {
      artist: artistArg
    })
  }

  pushSearchPage(){
    this.navCtrl.push(this.searchPage)
  }

  pushFavoritesPage(){
    this.navCtrl.push(this.favoritesPage)
  }

  //when user clicks play button app loads first music an musics array
  
  firstPlayMusic(){
    if (this.loadMusicProvider.musics.length>0)
      this.musicClicked(this.loadMusicProvider.musics[0], 0);
  }
}
