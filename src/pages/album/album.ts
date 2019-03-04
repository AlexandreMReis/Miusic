import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { PlayMusicProvider } from './../../providers/play-music/play-music';
import { IMusic } from '../../interfaces/IMusic.interface';
import { IMusicPlaying } from './../../interfaces/IMusicPlaying';
import { IAlbum } from './../../interfaces/IAlbum.interface';
import { LoadMusicProvider } from './../../providers/load-music/load-music';

@IonicPage()
@Component({
  selector: 'page-album',
  templateUrl: 'album.html',
})
export class AlbumPage implements OnInit {

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public playMusicProvider: PlayMusicProvider,
              public loadMusicProvider: LoadMusicProvider,
              private platform: Platform) {
  }

  album: IAlbum;
  orderedMusics: IMusic[];
  mediaTimer: NodeJS.Timer;
  albumPage: string;
  artistPage: string;
  searchPage: string;
  favoritesPage: string
  
  ngOnInit(){
    this.album = this.navParams.get('album');
    this.album.musics.sort(this.playMusicProvider.sortByTrack);
    this.albumPage = 'AlbumPage';
    this.artistPage = 'ArtistPage';
    this.searchPage = 'SearchPage';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AlbumPage');
  }

  firstPlayMusic() {
    if(this.album.musics.length>0)
    console.log("On album.page musics: " + this.album.title );

    let preMusicPlaying: IMusicPlaying = {
      music: this.album.musics[0],
      musicIndex: 0,
      musicsList: this.album.musics}
    
    this.playMusicProvider.musicClicked(preMusicPlaying);
  }

  musicClicked(musicArg: IMusic, musicIndex: number){
    console.log("On album.page musics: " + this.album.title );

    let preMusicPlaying: IMusicPlaying = {
      music: musicArg,
      musicIndex: musicIndex,
      musicsList: this.album.musics}
    
    this.playMusicProvider.musicClicked(preMusicPlaying);
  }

  chooseAlbum(albumArg: string){
    if(this.playMusicProvider.musicPlaying.music.album !== this.album){
      this.navCtrl.push(this.albumPage, {
        album: albumArg
      })
    }
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

}


