import { Injectable } from '@angular/core';
import { File, Entry} from '@ionic-native/file';
import { fetchFileAsBuffer } from 'id3-parser/lib/universal/helpers';
import { parse } from 'id3-parser';
import { IMusic } from './../../interfaces/IMusic.interface';
import { IArtist } from './../../interfaces/IArtist.interface';
import { IAlbum } from './../../interfaces/IAlbum.interface';
import { PlayMusicProvider } from './../play-music/play-music';
import { Diagnostic} from '@ionic-native/diagnostic';
import { IFavorites } from './../../interfaces/IFavorites.interface';
import { ToastController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { IID3Tag } from 'id3-parser/lib/interface';
import { resolve } from 'url';

const UNKNOWN_ALBUM = "unknown Album";
const UNKNOWN_ARTIST = "unknown Artist";
const APP_LOGO = "assets/imgs/logo.png";
const ROOT_DIRECTORY_SD_CARD = "Music";
const ROOT_DIRECTORY_INTERN_STORAGE = "Music";

@Injectable()
export class LoadMusicProvider {

  artists: IArtist[] = [];
            
  albums: IAlbum[] = [];

  musics: IMusic[] = [];

  recursiveCall_counter = 0;

  hasSdCard: boolean = false;

  loadingMusics: {internMemory: boolean, sdCard: boolean} = {internMemory: true, sdCard:  true};

  hasMusics: boolean = false;

  sdCardRootDirectory: string;

  favorites: IFavorites = {musics: [], artists: [], albums: [] };

  keysLocalStorage: any[];

  constructor(private file: File,
              private playMusicProvider: PlayMusicProvider,
              private diagnostic: Diagnostic,
              private toastController: ToastController,
              private nativeStorage: NativeStorage) {
  }

  presentToast(message: string, position: string) {
    let toast = this.toastController.create({
      message: message,
      duration: 1000,
      position: position
    });
    toast.present();
  }

  getSdCardDetails = function(): Promise<any>{
    return new Promise ((resolve) =>{
      this.diagnostic.isExternalStorageAuthorized()
      .then(isAuthorized => {
        if(!isAuthorized){
          this.diagnostic.requestExternalStorageAuthorization()
          .then(authorization => {
            this.diagnostic.getExternalStorageAuthorizationStatus()
            .then(authorizationStatus => {
              if(authorizationStatus==='GRANTED'){
                this.diagnostic.getExternalSdCardDetails()
                .then(details => {
                  //console.log("details:")
                  //console.log(details);
                  resolve(details);
                });
              }
            });
          });
        }else{
          this.diagnostic.getExternalSdCardDetails()
          .then(details => {
            resolve(details);
          });
        }
      });
    })
  }

  loadAllMusics = function(): Promise<string>{
    return new Promise((resolve) => {
      this.diagnostic.isExternalStorageAuthorized()
      .then(isAuthorized => {
        if(!isAuthorized){
          this.diagnostic.requestExternalStorageAuthorization()
          .then(authorization => {
            this.diagnostic.getExternalStorageAuthorizationStatus()
            .then(authorizationStatus => {
              if(authorizationStatus==='GRANTED'){
                this.diagnostic.getExternalSdCardDetails()
                .then(details => {
                  console.log("details:")
                  console.log(details);
                  this.loadMusicsFromSdCardAndMemory(details)
                  .then(res => {
                    resolve(res);
                  })
                });
              }
            });
          });
        }else{
          this.diagnostic.getExternalSdCardDetails()
          .then(details => {
            this.loadMusicsFromSdCardAndMemory(details)
            .then(res =>{ 
              resolve(res);
            });
          });
        }
      });
    });
  }

  loadMusicsFromSdCardAndMemory = function(details: any): Promise<string>{
    return new Promise((resolve) => {

      let count = 0;
      console.log("loadMusicsFromSdCardAndMemory");
      if(this.hasSdCard){
        /*this.hasSdCard=true
        this.sdCardRootDirectory = details[0].filePath + '/';*/
        this.file.checkDir(this.sdCardRootDirectory, ROOT_DIRECTORY_SD_CARD)
        .then( res =>{
          if(res){
            this.loadMusicsFromSdCard(ROOT_DIRECTORY_SD_CARD)
            .then(_ => {
              count++;
            })
          }
        })
        .catch(rej => console.log("does not have sdCard"));
      }
      this.file.checkDir(this.file.externalRootDirectory, ROOT_DIRECTORY_INTERN_STORAGE)
      .then( res =>{
        if(res){
          this.loadMusicsFromInternMemory(ROOT_DIRECTORY_INTERN_STORAGE)
          .then(_ => {
            count++;
          })
        }
      })
      if(count === 2){

        resolve("Musics Loaded From sdCard and Memory")
      }
    })
  }

  loadFavoritesFromNativeStorage(key: string){

    if( key.substring( key.indexOf("_") + 1, key.lastIndexOf("_")) == "music"){
      
      this.nativeStorage.getItem(key)
      .then(music =>{
        if(key.substring(key.lastIndexOf("_") + 1) == music.title){
          this.favorites.musics.push(music);
          console.log("------------------------------ Added from nativeStorage to favorites music: " + music.title);
        }
      });
    }else if(key.substring( key.indexOf("_") + 1, key.lastIndexOf("_")) == "album"){

    }else if(key.substring( key.indexOf("_") + 1, key.lastIndexOf("_")) == "artist"){

    }else{
      console.log("in loading favorites from nativeStorage key is neither music, album or artist");
    }
  }

  loadMusicsFromNativeStorage = function(): Promise<string>{
    return new Promise((resolve, reject) =>{
      this.file.checkDir(this.file.dataDirectory, '')
      .then(_ => {
        console.log('Directory exists')
        this.nativeStorage.keys().then(keys=> {
          console.log("keys from localStorage are: ");
          console.log(keys);
          this.keysLocalStorage = keys;
          if(keys.length > 0){
            for(let i=0; i < keys.length; i++){
              let key = keys[i];
              let firstToken = key.substring(0,9);
              console.log("first token:" + firstToken);
              if(firstToken == "favorites"){
                let secondToken = key.substring( key.indexOf("_") + 1, key.lastIndexOf("_"));
                let thirdToken = key.substring(key.lastIndexOf("_") + 1);
                console.log("second token:" + secondToken);
                console.log("third token:" + thirdToken);
                console.log("------------------------------ Will add from nativeStorage to favorites music: ")
                if(secondToken == 'music'){
                  this.nativeStorage.getItem(keys[i])
                  .then(musicInfo => {
                    this.createMusic(musicInfo.fullPath, musicInfo.musicName, musicInfo.artistName, musicInfo.albumName, musicInfo.track, musicInfo.composer, true)
                    .then( music => {
                      this.favorites.musics.push(music);
                    });
                  })
                }
                //this.loadFavoritesFromNativeStorage(key);
              }else{
                
                this.nativeStorage.getItem(keys[i])
                .then(musicInfo => {
                  console.log("musicInfo from nativeStorage " + musicInfo.musicName + ":");
                  console.log(musicInfo);
                  musicInfo.fullPath = musicInfo.fullPath.substr(1);
                  this.file.checkFile(musicInfo.rootDirectory, musicInfo.fullPath)
                  .then(res => {
                    //console.log("checked file: " + musicInfo.rootDirectory + musicInfo.fullPath);
                    this.createAndOrganizeFullTrack(musicInfo.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, musicInfo.composer, musicInfo.genre, musicInfo.year, musicInfo.onFavorites);
                    //console.log(res);
                  }).catch(res => {
                    console.log("file not found or gave error: " + musicInfo.rootDirectory + musicInfo.fullPath);
                    this.nativeStorage.remove(key).then(res => {
                      console.log(key + " removed from native Storage");
                    }).catch( rej => {
                      console.log("could not remove key: " + key + " from nativeStorage");
                    })
                  });
                  
                    //this.createAndOrganizeFullTrack(musicInfo.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, musicInfo.composer, musicInfo.genre, musicInfo.year, musicInfo.onFavorites);
                  if(i=== (keys.length-1)){
                    resolve("-------ALL MUSICS FROM NATIVE STORAGE LOADED-----");
                  }
                });
              }
            }
          }else{
            resolve("No musics on local storage");
          }
        }).catch(rej => {
          reject(rej);
        });
      }).catch(err => {
        console.log('Directory doesn\'t exist')
      });
    })
  }
  
  loadMusicsFromSdCard = function(directoryName: string): Promise<string>{
    return new Promise ((resolve) => {
      console.log("loadMusicsFromSdCard");
      this.file.listDir(this.sdCardRootDirectory, directoryName)
      .then((listing) => {
        let directory = {name: directoryName,
                        entries: listing,
                        parent: -1}
        this.readDirectoryRecursively(directory, this.sdCardRootDirectory, 0)
        .then( res => {
          this.loadingMusics.sdCard = false;
          console.log("+---------------------------musics from sd card read----------------------------------------");
        });
        resolve("reading musics from sdCard");
      }).catch(err => console.error('Error on this.file.listDir Opening directory: ' + directoryName + " and error was: " + err));
    })
  }

  loadMusicsFromInternMemory = function(directoryName: string): Promise<string>{
    return new Promise ((resolve) => {
    console.log("loadMusicsFromInternMemory");
    this.file.listDir(this.file.externalRootDirectory, directoryName)
    .then((listing) => {
      let directory = {name: directoryName,
                      entries: listing,
                      parent: -1}
      this.readDirectoryRecursively(directory, this.file.externalRootDirectory, 0)
      .then(_ => {
        this.loadingMusics.internMemory = false;
        console.log("Musics from intern memory read")
      });
      resolve("reading musics from internMemory");
    })
      .catch(err => console.error('Error on this.file.listDir Opening directory: ' + directoryName + " and error was: " + err));
    })
  }

  readDirectoryRecursively(directory: {name: string, entries: Entry[], parent: any}, rootDirectory: string, recursiveCall_counter : number): Promise<string>{
    return new Promise ((resolve) =>{
    
      console.log("+-------------New Entry to read-------------+");

      if(rootDirectory === this.file.externalRootDirectory)
        console.log("Intern Memory");
      else
        console.log("sdCard")
      
      console.log("readDirectoryRecursively Number: " + recursiveCall_counter);
      this.printEntriesFullPath(directory.entries);
      console.log("Parent Directory:")
      console.log(directory.parent);

      if(directory.entries.length===0){
        if(directory.parent == -1){
          console.log("directory.parent == -1");
          resolve("Have Read all entries");
        }else{
          console.log("Read Parent directory");
          this.readDirectoryRecursively(directory.parent, rootDirectory, recursiveCall_counter)
          .then(res => {
            resolve(res)
          });
        }
      }else{
        let entry = directory.entries.shift();
        console.log(entry.name);
        if(entry.isFile){

          let fileExtension : string = entry.name.substr(entry.name.length - 4);
          if(fileExtension === '.mp3'){
            let musicName = entry.name.slice(0, -4);
            let musicLoaded = this.checkIfMusicAlreadyLoaded(musicName);
            //console.log("checkIfMusicAlreadyLoaded: " + musicName);
            if(!musicLoaded){
              //console.log("Read Mp3 File: " + entry.name);
              this.readMp3File(directory.name, entry, rootDirectory).then(res => {
                //console.log("After reading mp3 file. Read Next Directory with entries: ")
                //this.printEntriesFullPath(directory.entries);
                this.readDirectoryRecursively(directory, rootDirectory, recursiveCall_counter)
                .then(res => {
                  resolve(res)
                });
              });
            }
          
          }else{
            
            this.readDirectoryRecursively(directory, rootDirectory, recursiveCall_counter)
            .then(res => {
              resolve(res)
            });
          }
        }else if(entry.isDirectory){
          //console.log("New directory to read: " + entry.name);
          this.file.listDir(rootDirectory, directory.name + '/' + entry.name)
          .then((listing) => {
            //console.log("Read directory: " + entry.name);
            let newDirectory = { name: directory.name + '/' + entry.name, entries: listing, parent: directory };
            this.readDirectoryRecursively(newDirectory, rootDirectory, recursiveCall_counter)
            .then(res => {
              resolve(res);
            });
          
          }).catch(err => {
            console.error('Error on this.file.listDir Opening directory: ' + directory + " and error was: " + err)
            resolve("error opening directory: " + directory.name);
          });

        }else{
          console.error("Entry is neither directory nor file ")
          resolve("Entry is neither directory nor file ");
        }
      }
    })
  }

  isMusicInNativeStorage(musicName: string, albumName: string, artistName: string): boolean{
    if(this.keysLocalStorage.length > 0){
      let musicKey = musicName + '_' + albumName + '_' + artistName;
      for(let i=0; i< this.keysLocalStorage.length-1; i++){
        if(this.keysLocalStorage[i] === musicKey){
          return true;
        }
      }
    }
    return false;
  }

  readMp3File = function(directory: string, fileEntry: Entry, rootDirectory: string): Promise<string>{
    return new Promise ((resolve, reject) => {
      //console.log("In readMp3File: " + fileEntry.name);
     
      let fullPath= directory + '/' + fileEntry.name;
      this.file.readAsDataURL(rootDirectory, fullPath)
      .then(url => {
        fetchFileAsBuffer(url).then(parse).then(tag => {

          if (tag){
            let musicInfo = this.defineMusicInfo(tag, fileEntry);
           
            //onsole.log("Music name: " + musicInfo.musicName + " fullPath: " + fileEntry.fullPath);
            if(!this.isMusicInNativeStorage(musicInfo.musicName, musicInfo.albumName, musicInfo.artistName)){
              this.saveMusicToNativeStorage(rootDirectory, fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, musicInfo.composer, musicInfo.genre, musicInfo.year, false);
              this.createAndOrganizeFullTrack(fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, musicInfo.composer, musicInfo.genre, musicInfo.year, false)
              .then(res =>{
                resolve(musicInfo.musicName + " created and added info");
              });
            }else{
              //console.log("music already loaded from native storage");
              resolve(musicInfo.musicName + " is in native storage , no need to load from external storage or sd card.")
            }
          }else{
            console.log("ID3 tag not found for mp3 file: " + fileEntry.name);
            let musicInfo = this.defineNoMusicInfo(fileEntry);
            //console.log("Music name: " + musicInfo.musicName + " fullPath: " + fileEntry.fullPath);
            if(!this.isMusicInNativeStorage(musicInfo.musicName, musicInfo.albumName, musicInfo.artistName)){
              this.saveMusicToNativeStorage(rootDirectory, fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, '', '', '', false);
              this.createAndOrganizeFullTrack(fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, '', '', '', false)
              .then(res =>{
                resolve(musicInfo.musicName + " created and added info");
              });
            }
          }
        }).catch(err => {
          console.log("Error fetching file mp3 as buffer: " + err);
          
          let musicInfo = this.defineNoMusicInfo(fileEntry);
          console.log("Music name: " + musicInfo.musicName + " fullPath: " + fileEntry.fullPath);
          if(!this.isMusicInNativeStorage(musicInfo.musicName, musicInfo.albumName, musicInfo.artistName)){
            this.saveMusicToNativeStorage(rootDirectory, fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, '', '', '')
            this.createAndOrganizeFullTrack(fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, '', '', '')
            .then(res =>{
              resolve(musicInfo.musicName + " created and added info");
            });
          }
        })
      }).catch(err => {
        console.log("Error reading mp3 file dataURL: " + err);
        
        let musicInfo = this.defineNoMusicInfo(fileEntry);
        //console.log("Music name: " + musicInfo.musicName + " fullPath: " + musicInfo.fileEntry.fullPath);
        if(!this.isMusicInNativeStorage(musicInfo.musicName, musicInfo.albumName, musicInfo.artistName)){
          this.saveMusicToNativeStorage(rootDirectory, fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, '', '', '')
          this.createAndOrganizeFullTrack(fileEntry.fullPath, musicInfo.musicName, musicInfo.albumName, musicInfo.artistName, musicInfo.track, musicInfo.imageSrc, musicInfo.imageMime, '', '', '')
          .then(res =>{
            resolve(musicInfo.musicName + " created and added info");
          });
        }
      });
    });
  }



  defineNoMusicInfo(fileEntry: Entry){
    //console.log("In defineNoMusicInfo: " + fileEntry.name);
    let musicInfo = { 
      musicName: fileEntry.name.slice(0, -4), 
      albumName: UNKNOWN_ALBUM, 
      artistName: UNKNOWN_ARTIST, 
      track: -1,
      imageSrc: APP_LOGO,
      imageMime: '',
      onFavorites: false
    }
    return musicInfo;
  }

  defineMusicInfo(tag : IID3Tag, fileEntry: Entry){
    //console.log("In defineMusicInfo: " + fileEntry.name);
    let musicName, artistName, albumName, imageSrc, imageMime, composer, genre, year: string;
    let track: number;

    if(tag.title === '')
      musicName = fileEntry.name.slice(0, -4);
    else
      musicName = tag.title;

    if(tag.album === ''){
      albumName = UNKNOWN_ALBUM;
      track = -1;
    }else{
      albumName = tag.album;
      track = this.getTrackNumber(tag.track);
    }
    if(tag.artist === '')
    artistName = UNKNOWN_ARTIST;
    else
      artistName = tag.artist;
    //console.log("tag.hasOwnProperty('image')= "+ tag.hasOwnProperty('image'));
    if(tag.hasOwnProperty('image')){
      imageSrc ='data:image/jpeg;base64,' + this.base64ArrayBuffer(tag.image.data);
      imageMime =tag.image.mime;
    }else{
      imageSrc = APP_LOGO;
      imageMime = '';
    }
    if(tag.hasOwnProperty('composer')){
      composer = tag.composer;
      //console.log("Composer: " + tag.composer);
    }else{
      composer = '';
    }
    if(tag.hasOwnProperty('genre')){
      genre = tag.genre;
      //console.log("Genre: " + tag.genre);
    }else{
      genre = '';
    }
    
    if(tag.hasOwnProperty('year')){
      year = tag.year.slice(0,4);
      //console.log("Year: " + tag.year);
    }else{
      year = '';
    }
    let musicInfo= {
      track: track, 
      musicName: musicName, 
      albumName: albumName, 
      artistName: artistName, 
      imageSrc: imageSrc, 
      imageMime: imageMime, 
      composer: composer, 
      genre: genre, 
      year: year,
      onFavorites: false
    }
    return musicInfo;
  }

  checkIfMusicAlreadyLoaded(musicName: string) {
    for (var i = 0; i < this.musics.length; i++) {
        if (this.musics[i].title === musicName) {
            return true;
        }
    }
    return false;
  }

  saveMusicToNativeStorage(rootDirectory: string, fullPath: string, musicName: string, albumName: string, artistName: string, track: number, imageSrc: string, imageMime: string, composer: string, genre: string, year: string, onFavorites: boolean){
    let musicToStorage = {
      fullPath: fullPath, 
      musicName: musicName, 
      artistName: artistName, 
      albumName: albumName, 
      imageSrc: imageSrc,
      imageMime: imageMime,
      track: track, 
      composer: composer,
      genre: genre,
      year:year,
      onFavorites: onFavorites,
      rootDirectory: rootDirectory
    }
    //console.log(musicName + " saved to localStorage with id: " + musicName + '_' + albumName + '_' + artistName);
    this.nativeStorage.setItem(musicName + '_' + albumName + '_' + artistName, musicToStorage);
  }

  createAndOrganizeFullTrack = function(fullPath: string, musicName: string, albumName: string, artistName: string, track: number, imageSrc: string, imageMime: string, composer: string, genre: string, year: string, onFavorites: boolean): Promise<string>{
    return new Promise((resolve) =>{
      //console.log('');
      //console.log('On createAndOrganizeFullTrackg on Music: ' + musicName + ' Album: ' + albumName + ' Artist: ' + artistName );
      this.createMusic(fullPath, musicName, artistName, albumName, track, composer, onFavorites)
      .then(music => {
        if(!this.checkIfAlbumExists(albumName, artistName)){
          //console.log("Will create album: " + albumName + " with first music: " + musicName);
          this.createAlbum(music, albumName, imageSrc, imageMime, genre, year)
          .then(album => {
            if(!this.checkIfArtistExists(artistName)){
              //console.log("Will create artist: " + artistName + " with first album: " + albumName);
              this.createArtist(album, artistName)
              .then(
                resolve("created artist: " + artistName + " and added album: " + album.title)
              )
            }
            else{
              //console.log("Will add album: " + albumName + " to artist: " + artistName)
              this.addAlbumToArtist(album, artistName)
              .then(_ => {
                resolve("created artist: " + artistName + " and added album: " + album.title)
              })
            }
          });
        }else{
          //console.log("Will add music: " + musicName + " to album: " + albumName)
          this.addMusicToAlbum(music, albumName).then(_=>{
            resolve("added music: "+ music.title + " to album: " + albumName);
          });
        }
      });
    });
  }

  createMusic = function(fullPathArg: string, titleArg: string, artistNameArg: string, albumNameArg: string, trackArg: number, composer: string, onFavorites: boolean): Promise<IMusic>{
    return new Promise((resolve) =>{
      //console.log("Creating music");
     // console.log("Track: " + trackArg + " Title: " + titleArg + " Artist: " + artistNameArg + " Album: " + albumNameArg);
      //console.log("");
      if(!this.hasMusics){
        this.hasMusics = true;
      }
      let music = {
        fullPath: fullPathArg,
        title: titleArg,
        artistName: artistNameArg,
        albumName: albumNameArg,
        track: trackArg,
        composer: composer,
        onFavorites: onFavorites
      }
      this.musics.push(music);
      this.hasMusics = true;
      resolve(music);
    });
  }

  createAlbum = function (musicArg: IMusic, albumNameArg: string, imageSrc: string, imageMime: string, genre: string, year: string): Promise<IAlbum>{
    return new Promise((resolve) => {
      console.log("Create Album: " + albumNameArg);
      let musicsArray: IMusic[] = [];
      musicsArray.push(musicArg);
      //console.log("Album " + albumNameArg);
      //console.log("imageSrc: " + imageSrc);
      let album = {
        title: albumNameArg,
        musics : musicsArray,
        imageSrc: imageSrc,
        imageMime: imageMime,
        artistName: musicArg.artistName,
        genre: genre,
        year: year,
        onFavorites: false
      }
      musicArg.album=album;
      this.albums.push(album);
      resolve(album);
    })
  }

  createArtist = function (albumArg: IAlbum, artistNameArg: string): Promise<IArtist>{
    return new Promise((resolve) => {
     // console.log('creating artist' + artistNameArg);
      let albumsArray: IAlbum[] = [];
      albumsArray.push(albumArg);
      let artist = {
        name: artistNameArg,
        albums : albumsArray,
        musics: albumArg.musics,
        onFavorites: false
      }
      
      albumArg.artist=artist;
      this.artists.push(artist);
      resolve(artist);
    })
  }

  addMusicToAlbum = function(musicArg: IMusic , albumTitleArg: string): Promise<IAlbum>{
    return new Promise ((resolve) => {

      for(let i=0; i < this.albums.length; i++){
        if(albumTitleArg === this.albums[i].title){
          musicArg.album=this.albums[i];
          this.albums[i].musics.push(musicArg);
          if(albumTitleArg === UNKNOWN_ALBUM){
            this.albums[i].musics.sort(this.playMusicProvider.sortByTitle);
          }else{
            this.albums[i].musics.sort(this.playMusicProvider.sortByTrack);
          }
          resolve(this.albums[i]);
          break;
        }
      }
    })
  }

  addAlbumToArtist(albumArg: IAlbum , artistNameArg: string): Promise<IArtist>{
    return new Promise ((resolve) => {
      let index: number;
      for(let i=0; i < this.artists.length; i++){
        if(artistNameArg === this.artists[i].name){
          albumArg.artist=this.artists[i];
          this.artists[i].albums.push(albumArg);
          this.artists[i].albums.sort(this.playMusicProvider.sortByTitle);
          this.artists[i].musics.concat(albumArg.musics);
          this.artists[i].musics.sort(this.playMusicProvider.sortByTitle);
          index = i;
          break;
        }
      }
      resolve(this.artists[index]);
    })
  }

  checkIfAlbumExists(albumTitleArg: string, artistNameArg: string) : boolean{
    //console.log("checkIfAlbumExists: " + albumTitleArg);
    for(let i=0; i<this.albums.length; i++){
      if((albumTitleArg === this.albums[i].title) && (this.albums[i].artistName === artistNameArg)){
        return true;
      }
    }
    return false;
  }

  checkIfArtistExists(artistNameArg: string) : boolean{
    for(let i=0; i < this.artists.length; i++){
      if(artistNameArg === this.artists[i].name){
        return true;
      }
    }
    return false;
  }

  addMusicToFavorites(){
    console.log(this.playMusicProvider.musicPlaying.music.title + " added to Favorites.")
    this.presentToast( this.playMusicProvider.musicPlaying.music.title + " added to Favorites.", 'top');
    this.playMusicProvider.musicPlaying.music.onFavorites = true;
    this.favorites.musics.push( this.playMusicProvider.musicPlaying.music);
    let musicToStorage = this.createMusicToStorageFromMusicPlaying();
    this.nativeStorage.remove(this.playMusicProvider.musicPlaying.music.title + '_' + this.playMusicProvider.musicPlaying.music.album.title + '_' + this.playMusicProvider.musicPlaying.music.artistName)
    .then(res => {
      this.nativeStorage.setItem(this.playMusicProvider.musicPlaying.music.title + '_' + this.playMusicProvider.musicPlaying.music.album.title + '_' + this.playMusicProvider.musicPlaying.music.artistName, musicToStorage)
      .then(res => {
        console.log(this.playMusicProvider.musicPlaying.music.title + " saved to native storage as favorite");
      })
      .catch(_ => 
        console.log(this.playMusicProvider.musicPlaying.music.title + " not saved as favorite")
      );
    })
  }

  createMusicToStorageFromMusicPlaying(){
    let musicToStorage = {
      fullPath: this.playMusicProvider.musicPlaying.music.fullPath, 
      musicName: this.playMusicProvider.musicPlaying.music.title, 
      artistName: this.playMusicProvider.musicPlaying.music.artistName, 
      albumName: this.playMusicProvider.musicPlaying.music.album.title, 
      imageSrc: this.playMusicProvider.musicPlaying.music.album.imageSrc,
      imageMime: this.playMusicProvider.musicPlaying.music.album.imageMime,
      track: this.playMusicProvider.musicPlaying.music.track, 
      composer: this.playMusicProvider.musicPlaying.music.composer,
      genre: this.playMusicProvider.musicPlaying.music.album.genre,
      year: this.playMusicProvider.musicPlaying.music.album.year,
      onFavorites: true
    };
    return musicToStorage;
  }

  addMusicToFavorites2(){
    console.log(this.playMusicProvider.musicPlaying.music.title + " added to Favorites.")
    this.presentToast( this.playMusicProvider.musicPlaying.music.title + " added to Favorites.", 'top');
    this.playMusicProvider.musicPlaying.music.onFavorites = true;

    let music = this.createMusicToStorageFromMusicPlaying();

    this.nativeStorage.setItem('favorites_music_' + this.playMusicProvider.musicPlaying.music.title, music)
    .then(res=>{
      console.log("after calling setItem in addmusictofavorites2");
      this.nativeStorage.keys().then(keys => {
        console.log("keys in native storage after calling setitem in addfavorites 2");
        console.log(keys);
      })
    });
    this.favorites.musics.push(this.playMusicProvider.musicPlaying.music);
  }

  removeMusicFromFavorites2(){
    this.presentToast(this.playMusicProvider.musicPlaying.music.title + " removed from Favorites.", 'top')
    this.playMusicProvider.musicPlaying.music.onFavorites = false;
    let music = this.playMusicProvider.musicPlaying.music;
    this.nativeStorage.remove("favorites_music_" + music);
    for(let i=0; i<this.favorites.musics.length; i++){
      if(this.favorites.musics[i].title == music.title)
        this.favorites.musics.splice(i, 1);
    }
  }

  addArtistToFavorites(artist: IArtist){
    this.presentToast(artist.name + " added to Favorites.", 'top')
    artist.onFavorites = true;
    this.favorites.artists.push(artist);

  }

  addAlbumToFavorites(album: IAlbum){
    this.presentToast(album.title + " added to Favorites.", 'top')
    album.onFavorites = true;
    this.favorites.albums.push(album);
  }

  removeMusicFromFavorites(){
    this.presentToast(this.playMusicProvider.musicPlaying.music.title + " removed from Favorites.", 'top')
    this.playMusicProvider.musicPlaying.music.onFavorites = false;
    for(let i=0; i<this.favorites.musics.length; i++){
      if(this.favorites.musics[i] === this.playMusicProvider.musicPlaying.music)
        this.favorites.musics.splice(i, 1);
    }
    let musicToStorage = {
      fullPath: this.playMusicProvider.musicPlaying.music.fullPath, 
      musicName: this.playMusicProvider.musicPlaying.music.title, 
      artistName: this.playMusicProvider.musicPlaying.music.artistName, 
      albumName: this.playMusicProvider.musicPlaying.music.album.title, 
      imageSrc: this.playMusicProvider.musicPlaying.music.album.imageSrc,
      imageMime: this.playMusicProvider.musicPlaying.music.album.imageMime,
      track: this.playMusicProvider.musicPlaying.music.track, 
      composer: this.playMusicProvider.musicPlaying.music.composer,
      genre: this.playMusicProvider.musicPlaying.music.album.genre,
      year: this.playMusicProvider.musicPlaying.music.album.year,
      onFavorites: false
    }
    this.nativeStorage.setItem(this.playMusicProvider.musicPlaying.music.title + '_' + this.playMusicProvider.musicPlaying.music.album.title + '_' + this.playMusicProvider.musicPlaying.music.artistName, musicToStorage)
    .then(_ => 
      console.log (this.playMusicProvider.musicPlaying.music.title + " removed from favorites")
    )
    .catch(_ => 
      console.log("error: " + this.playMusicProvider.musicPlaying.music.title + " not removed from favorites")
    );
  }

  removeAlbumFromFavorites(album: IAlbum){
    this.presentToast(album.title + " removed to Favorites.", 'top')
    album.onFavorites = false;
    for(let i=0; i<this.favorites.albums.length; i++){
      if(this.favorites.albums[i] === album){
        console.log("deleted album from favorites: ")
        console.log(this.favorites.albums.splice(i, 1));
      }
    }
  }

  removeArtistFromFavorites(artist: IArtist){
    this.presentToast(artist.name + " removed from Favorites.", 'top')
    artist.onFavorites = false;
    for(let i=0; i<this.favorites.artists.length; i++){
      if(this.favorites.artists[i] === artist){
        console.log("deleted artist from favorites: ")
        console.log(this.favorites.artists.splice(i, 1));
      }
    }
  }

  getTrackNumber(track: string | number): number{
    let track_str: string = track.toString();
    if(track_str.length < 3)
      return Number(track_str);
    else{
      if(track_str[1] === "/")
        return Number(track_str[0]);
      else
        return Number(track_str.substring(0,2));
    }
  }

  sortMusicsOnFav(){
    this.favorites.musics.sort(this.playMusicProvider.sortByTitle);
  }

  sortAlbumsOnFav(){
    this.favorites.albums.sort(this.playMusicProvider.sortByTitle);
  }

  sortArtistsOnFav(){
    this.favorites.artists.sort(this.playMusicProvider.sortByName);
  }

  sortMusics(){
    this.musics.sort(this.playMusicProvider.sortByTitle);
  }

  sortAlbums(){
    this.albums.sort(this.playMusicProvider.sortByTitle);
  }

  sortArtists(){
    this.artists.sort(this.playMusicProvider.sortByName);
  }

  base64ArrayBuffer(arrayBuffer) {
    
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes         = new Uint8Array(arrayBuffer)
    var byteLength    = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]

      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4 // 3   = 2^2 - 1

      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }
    return base64
  }

  printEntriesFullPath(entries: Entry[]){
    for(let i=0; i<entries.length; i++){
      console.log(i + ": " + entries[i].fullPath);
    }
  }
}
