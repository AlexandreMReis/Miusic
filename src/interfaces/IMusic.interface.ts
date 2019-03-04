import { IAlbum } from './IAlbum.interface';

export interface IMusic {
    fullPath: string;
    title: string;
    album?: IAlbum;
    artistName: string;
    currentPosition?: string;
    track: number;
    curr_pos?:number;
    composer: string;
    onFavorites: boolean;
}