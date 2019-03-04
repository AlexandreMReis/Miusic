import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { PlayMusicProvider } from './../../providers/play-music/play-music';
import { LoadMusicProvider } from './../../providers/load-music/load-music';
import { IMusicPlaying } from './../../interfaces/IMusicPlaying';
import { IMusic } from './../../interfaces/IMusic.interface';
import { IAlbum } from '../../interfaces/IAlbum.interface';
import { IArtist } from '../../interfaces/IArtist.interface';


@Component({
  selector: 'page-favorites',
  templateUrl: 'favorites.html',
})
export class FavoritesPage implements OnInit {
  library: string = 'artists';
  albumPage : string;
  artistPage: string;
  searchPage: string;


  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public playMusicProvider: PlayMusicProvider,
              public loadMusicProvider: LoadMusicProvider) {
  }

  ngOnInit(){
    this.albumPage = 'AlbumPage';
    this.artistPage = 'ArtistPage';
    this.searchPage ='SearchPage'

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FavoritesPage');

  }

  musicClicked(musicArg: IMusic, musicIndex: number){
    let preMusicPlaying: IMusicPlaying = {
      music: musicArg,
      musicIndex: musicIndex,
      musicsList: this.loadMusicProvider.favorites.musics}
    
    this.playMusicProvider.musicClicked(preMusicPlaying);
  }

  chooseAlbum(albumArg: string){
    this.navCtrl.push(this.albumPage, {
      album: albumArg
    })
  }

  chooseArtist(artistArg: string){

    this.navCtrl.push(this.artistPage, {
      artist: artistArg
    })
  }

  goBack(){
    this.navCtrl.pop();
  }

  pushSearchPage(){
    this.navCtrl.push(this.searchPage)
  }

}
