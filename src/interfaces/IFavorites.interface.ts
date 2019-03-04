import { IArtist } from './IArtist.interface';
import { IAlbum } from "./IAlbum.interface";
import { IMusic } from "./IMusic.interface";

export interface IFavorites {
    artists: IArtist[];
    albums: IAlbum[];
    musics: IMusic[];
}