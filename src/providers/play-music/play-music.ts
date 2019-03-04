import { File } from '@ionic-native/file';
import { IArtist } from './../../interfaces/IArtist.interface';
import { Injectable} from '@angular/core';
import { IMusic } from '../../interfaces/IMusic.interface';
import { MediaObject, Media } from '@ionic-native/media';
import { IAlbum } from './../../interfaces/IAlbum.interface';
import { MusicControls } from '@ionic-native/music-controls/';
import { IMusicPlaying } from './../../interfaces/IMusicPlaying';
import { ToastController } from 'ionic-angular';

const normalSkip= 0;
const shuffleSkip = 1;
const loopSkip = 2;

@Injectable()
export class PlayMusicProvider{

  

  musicObject: MediaObject;
  musicPlaying: IMusicPlaying;
  isPlay: boolean = false;
  played: boolean = false;
  mediaTimer: NodeJS.Timer;
  mediaTimer2: NodeJS.Timer;
  curr_pos: number = 0;
  currentPosition: number = 0;
  musicDuration: number = 100;
  inputCurrentPosition: number;
  durationStr: string;
  currentPosStr: string;
  skipMethods = [shuffleSkip, loopSkip];
  methodActive = normalSkip;

  constructor(private media: Media,
              private file: File,
              public musicControls: MusicControls,
              public toastController: ToastController) {
  }

  presentToast(message: string) {
    let toast = this.toastController.create({
      message: message,
      duration: 1000,
    });
    toast.present();
  }

  changeSkipMethod(){
    if(this.methodActive === 0)
      this.presentToast("Shuffle");
    else if(this.methodActive === 1)
      this.presentToast("Loop Music");
    else if(this.methodActive === 2)
      this.presentToast("Normal")
    this.skipMethods.push(this.methodActive);
    this.methodActive = this.skipMethods.shift();
    
    
  }

  createMusicControlsNotification(): Promise <any>{
    return new Promise((resolve) =>{
      this.musicControls.create({
        track: this.musicPlaying.music.title,
        artist: this.musicPlaying.music.artistName,
        cover: this.musicPlaying.music.album.imageSrc,
        isPlaying : true,
        dismissable: true,
        hasPrev   : true,      // show previous button, optional, default: true
        hasNext   : true,

        playIcon: 'media_play',
        pauseIcon: 'media_pause',
        prevIcon: 'media_prev',
        nextIcon: 'media_next',
        closeIcon: 'media_close',
        notificationIcon: 'notification'
      })
      .then(res => {
        
        resolve(res);
      
      })
    });
  }

  subscribeMusicControls(){

    this.musicControls.subscribe().subscribe(action => {

      const message = JSON.parse(action).message;
        switch(message) {

          case 'music-controls-next':
            console.log("next-music")
            this.skipForward()
            break;

          case 'music-controls-previous':
            console.log("previous music")
            this.skipBack()
            break;

          case 'music-controls-pause':
            console.log("pause music")
            this.pauseMusic()
            break;

          case 'music-controls-play':
            console.log("play music");
            this.playMusic();
          break;

          case 'music-controls-destroy':
            console.log("destroy music");
            this.musicControls.destroy();
            this.musicObject.pause();
            this.isPlay=false;
            break;
          
          default:

            break;
          }
        
    })
    this.musicControls.listen();
  }

  musicClicked = function (preMusicPlaying: IMusicPlaying): Promise <string>{
    return new Promise((resolve) => {
      
      
      console.log("");
      console.log('In play-musicProvider music clicked was: ');
      this.printMusic(preMusicPlaying.music);
      
      if(this.played){
        this.musicObject.release();
        this.musicPlaying= preMusicPlaying;
        this.musicObject = this.media.create(preMusicPlaying.music.fullPath);
        this.subscribeToSkipForward(); // subscribe to play next music when this music is finished
        this.createMusicControlsNotification()
        .then(res=> {
          console.log(res);
          this.subscribeMusicControls();
          this.playMusic()
          resolve("Music Clicked");
        });
        
      }else{
        this.musicPlaying= preMusicPlaying;
        this.musicObject = this.media.create(preMusicPlaying.music.fullPath);
        this.subscribeToSkipForward(); // plays next music when this music is finished
        this.played = true;
        this.createMusicControlsNotification()
        .then(res=> {
          console.log(res);
          this.subscribeMusicControls();
          this.playMusic()
          resolve('First Click On Music');
        });
      }
    })
  }

  subscribeToSkipForward(){
    console.log("in subscribe to skip forward")
    this.musicObject.onStatusUpdate.subscribe(status => {

      if(status === 0){
        console.log("Status: NONE musicName: " + this.musicPlaying.music.title);

      }else if(status ===1){
        console.log("Status: Starting musicName: " + this.musicPlaying.music.title);   
        let duration:number;
        let self=this;
        this.mediaTimer = setInterval(function(){  
          duration=self.musicObject.getDuration() -1;
          if(duration < 0){
            self.durationStr = '';
            self.musicDuration = 100;
            //console.log(" > duration= " + self.durationStr);

          }else{
            self.musicDuration = Math.floor(duration);
            self.durationStr= self.transformSecondsToMinutes(duration);
            //console.log(" > duration= " + self.durationStr);
          }
        }, 500);

        let self2=this;
        this.mediaTimer2 = setInterval(function(){  

          if(self2.currentPosition != self2.curr_pos){
            self2.musicObject.seekTo(self2.currentPosition*1000);
            self2.curr_pos=self2.currentPosition;
          }else{
            self2.musicObject.getCurrentPosition().then(curr_pos => {
              if(curr_pos < 0){
                self2.currentPosition = 0;
                self2.currentPosStr = '';
                //console.log(" > curr_pos= " + self2.currentPosStr);
              }else{
                self2.curr_pos=Math.floor(curr_pos);
                self2.currentPosition=self2.curr_pos;
                self2.currentPosStr = self2.transformSecondsToMinutes(curr_pos);
                //console.log(" > curr_pos= " + self2.currentPosStr);
              }
                    
              if(curr_pos >= duration && duration >= 0){ //reach end of music
                console.log("curr_pos >= duration && duration >0");
                console.log("methodActive: ");
                console.log(self2.methodActive);

                if(self2.methodActive === loopSkip  ){
                  self2.musicObject.stop();
                  self2.musicObject.play();
                }else{
                self2.skipForward();
                }  
              }
            });
          }
        }, 200);
      }else if(status === 2){
        console.log("Status: Playing musicName: " + this.musicPlaying.music.title);

      }else if(status === 3){
        console.log("Status: Paused musicName: " + this.musicPlaying.music.title);
      
      }else if(status === 4){
        console.log("Status: Stoped musicName: " + this.musicPlaying.music.title);
        
      }
    });

    this.musicObject.onSuccess.subscribe(() => { 
      console.log(" > onSuccess complete");
    });

    this.musicObject.onError.subscribe(error => {
      console.log(" > onError= "); console.log(error); 
      this.presentToast("Could not play music.");
    });
  }



  transformSecondsToMinutes(time: number){
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time - minutes * 60);

    let secondsStr:string;

    if (seconds < 10)
      secondsStr="0"+ seconds.toString();
    else
      secondsStr=seconds.toString(); 
   
    return minutes.toString() + ':' + secondsStr;

  }

  skipBack(){

    
    let previousMusicPlaying: IMusicPlaying;

    if(this.currentPosition < 10 && this.musicPlaying.musicIndex > 0){
      let previous_index: number = this.musicPlaying.musicIndex - 1;

      previousMusicPlaying = {
        music: this.musicPlaying.musicsList[previous_index],
        musicIndex: previous_index,
        musicsList: this.musicPlaying.musicsList}

      this.musicClicked(previousMusicPlaying);
    }else if((this.currentPosition >= 10) || (this.musicPlaying.musicIndex === 0)){
      this.musicClicked(this.musicPlaying);

    }
    
  }

  skipNext(){
    let next_index: number;
      let nextMusicPlaying: IMusicPlaying;

      if(this.musicPlaying.musicIndex < (this.musicPlaying.musicsList.length - 1))
        next_index= this.musicPlaying.musicIndex + 1;
      else if(this.musicPlaying.musicIndex === (this.musicPlaying.musicsList.length - 1))
        next_index=0;

      nextMusicPlaying = {
        music: this.musicPlaying.musicsList[next_index],
        musicIndex: next_index,
        musicsList: this.musicPlaying.musicsList}

      this.musicClicked(nextMusicPlaying);

  }


  skipForward(){

    if(this.methodActive === shuffleSkip)
      this.randomSkip();
    else{
      this.skipNext()
    }
  }

  randomSkip(){
    let next_index: number;
    let nextMusicPlaying: IMusicPlaying;
    
    next_index = Math.round(Math.random() * this.musicPlaying.musicsList.length);

    nextMusicPlaying = {
      music: this.musicPlaying.musicsList[next_index],
      musicIndex: next_index,
      musicsList: this.musicPlaying.musicsList}

    this.musicClicked(nextMusicPlaying);
  }

  playMusic(){
    this.musicControls.updateIsPlaying(true);
    this.musicObject.play();
    this.isPlay=true;
    console.log("playing Music" + this.musicPlaying.music.title);
  }

  pauseMusic(){
    this.musicControls.updateIsPlaying(false);
    this.musicObject.pause();
    this.isPlay=false;
  }

  printMusic(musicArg: IMusic){
    console.log(musicArg.track + ' Title: ' + musicArg.title + " fullPath: " + musicArg.fullPath);
  }

  printMusics(musicsArg: IMusic[]){
    musicsArg.forEach(music => {
      this.printMusic(music);
    });
    console.log("");
  }

  sortByTrack(a, b){
    if (a.track < b.track)
      return -1;
    if (a.track > b.track)
      return 1;
    return 0;
  }

  sortByTitle(a: IMusic| IAlbum, b: IMusic | IAlbum){
    let title1 = a.title.toLocaleUpperCase();
    let title2 = b.title.toLocaleUpperCase();
    if (title1 < title2)
      return -1;
    if (title1 > title2)
      return 1;
    return 0;
  }

  sortByName(a: IArtist, b: IArtist){
    let title1 = a.name.toLocaleUpperCase();
    let title2 = b.name.toLocaleUpperCase();
    if (title1 < title2)
      return -1;
    if (title1 > title2)
      return 1;
    return 0;
  }
}
