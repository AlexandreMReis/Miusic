import { IAlbum } from "./IAlbum.interface";
import { IMusic } from "./IMusic.interface"

export interface IArtist {
    name: string;
    albums?: IAlbum[];
    musics?: IMusic[];
    onFavorites: boolean;
}

