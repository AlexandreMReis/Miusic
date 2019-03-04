import { IMusic } from "./IMusic.interface";

export interface IMusicPlaying {
    music: IMusic;
    musicIndex: number;
    musicsList: IMusic[];
}