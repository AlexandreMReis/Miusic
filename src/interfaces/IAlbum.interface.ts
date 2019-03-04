import { IMusic } from './IMusic.interface';
import { IArtist } from './IArtist.interface';

export interface IAlbum {
    title: string;
    artist?: IArtist;
    musics?: IMusic[];
    imageMime?: string;
    imageSrc?: string;
    genre: string;
    year: string;
    onFavorites: boolean;
    artistName: string;
}

