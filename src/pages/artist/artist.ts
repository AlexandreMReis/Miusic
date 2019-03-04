import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { IMusic } from '../../interfaces/IMusic.interface';
import { IMusicPlaying } from './../../interfaces/IMusicPlaying';
import { LoadMusicProvider } from './../../providers/load-music/load-music';
import { PlayMusicProvider } from './../../providers/play-music/play-music';
import { IArtist } from './../../interfaces/IArtist.interface';



@IonicPage()
@Component({
  selector: 'page-artist',
  templateUrl: 'artist.html',
})

export class ArtistPage implements OnInit {

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public playMusicProvider: PlayMusicProvider,
              public loadMusicProvider: LoadMusicProvider,
              private platform: Platform) {
  }

  artist: IArtist;
  albumPage : string;
  artistPage: string;
  searchPage: string
  allMusicsFlag: boolean = false;
  favoritesPage: string;
  
  ngOnInit(){
    this.artist = this.navParams.get('artist');
    this.albumPage = 'AlbumPage';
    this.artistPage = 'ArtistPage';
    this.artist.albums.sort(this.playMusicProvider.sortByTitle);
    this.searchPage ='SearchPage';
    this.favoritesPage = 'FavoritesPage';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ArtistPage');
  }

  chooseAlbum(albumArg: string){
    this.navCtrl.push(this.albumPage, {
      album: albumArg
    })
  }

  chooseArtist(artistArg: string){
    if(this.playMusicProvider.musicPlaying.music.artistName !== this.artist.name){
      this.navCtrl.push(this.artistPage, {
        artist: artistArg
      })
    }
  }

  showAllMusics(){
    this.allMusicsFlag = true;
  }

  musicClicked(musicArg: IMusic, musicIndex: number){
    let preMusicPlaying: IMusicPlaying = {
      music: musicArg,
      musicIndex: musicIndex,
      musicsList: this.artist.musics}
    
    this.playMusicProvider.musicClicked(preMusicPlaying);
  }

  showAlbums(){
    this.allMusicsFlag = false;
  }

  firstPlayMusic(){
  }

  pushSearchPage(){
    this.navCtrl.push(this.searchPage)
  }

  pushFavoritesPage(){
    this.navCtrl.push(this.favoritesPage)
  }

}


