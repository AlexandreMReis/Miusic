import { PlayMusicProvider } from './../../providers/play-music/play-music';
import { IAlbum } from './../../interfaces/IAlbum.interface';
import { LoadMusicProvider } from './../../providers/load-music/load-music';
import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, Platform } from 'ionic-angular';
import { IArtist } from '../../interfaces/IArtist.interface';
import { IMusic } from '../../interfaces/IMusic.interface';
import { IMusicPlaying } from './../../interfaces/IMusicPlaying';


@IonicPage()
@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage implements OnInit{

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchPage');
  }

  albumPage: string;
  artistPage: string;

  artists: IArtist[];
  albums: IAlbum[];
  musics: IMusic[];

  constructor(private loadMusicProvider: LoadMusicProvider,
              private navCtrl: NavController,
              public playMusicProvider: PlayMusicProvider,
              private platform: Platform) {
    this.initializeItems();
  }

  ngOnInit(){
    this.albumPage = 'AlbumPage';
    this.artistPage = 'ArtistPage';
  }

  initializeItems() {
    this.artists = this.loadMusicProvider.artists;
    this.musics = this.loadMusicProvider.musics;
    this.albums = this.loadMusicProvider.albums;
  }

  getItems(ev) {
    this.initializeItems();

    // set val to the value of the ev target
    var val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {

      this.artists = this.loadMusicProvider.artists.filter((artist) => {
        return (artist.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
      this.albums = this.loadMusicProvider.albums.filter((album) => {
        return (album.title.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
      this.musics = this.loadMusicProvider.musics.filter((music) => {
        return (music.title.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })

    }
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

  musicClicked(musicArg: IMusic, musicIndex: number){
    let preMusicPlaying: IMusicPlaying = {
      music: musicArg,
      musicIndex: musicIndex,
      musicsList: this.musics}
    
    this.playMusicProvider.musicClicked(preMusicPlaying);
  }

}
