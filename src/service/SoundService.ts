import { SoundData } from '../data/SoundData';
import { SoundDataList } from '../data/SoundDataList';
import FS from 'fs';

export class SoundService {

    private readonly FILE_PATTERN:RegExp = /^(?!-)([aA-zZ0-1-]+-)?data\.json/;
    private readonly URL_PATTERN:RegExp = /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    private readonly SOUND_FILENAME_PATTERN:RegExp = /^[^/?*:;{}\\]+\.[^/?*:;{}\\]+$/;
    private readonly SOUNDS_PATH:string = "resources/sounds/";

    private sounds:Array<SoundData>;

    constructor(){
        this.loadSounds();
    }

    public loadSounds(){
        FS.readdir("resources/", (err, files) => {
            this.sounds = new Array<SoundData>();
            files.filter(file => file.match(this.FILE_PATTERN)).forEach(file => {
                var dataList:SoundDataList = require("../../resources/"+file);
                this.sounds = this.sounds.concat(dataList.sounds)
                console.log("Loaded "+file+" data file");
            });
        });
    }

    public getRandomSound(): SoundData {
        let randomIndex = Math.floor(Math.random() * this.sounds.length);
        return this.setSoundLocation(this.sounds[randomIndex]);
    }

    public getSound(soundName: string): SoundData {
        let matchSounds = this.sounds.filter((sound:any) => sound.tags.toLowerCase().includes(soundName.toLowerCase()));
        if (matchSounds != null && matchSounds.length > 0) {
            if (matchSounds.length == 1) {
                return this.setSoundLocation(matchSounds[0]);
            }
            else {
                let randomIndex = Math.floor(Math.random() * matchSounds.length);
                return this.setSoundLocation(matchSounds[randomIndex]);
            }
        }
        return null;
    }

    private setSoundLocation(soundData:SoundData):SoundData{
        if(this.isURL(soundData.filename)) {
            soundData.location = soundData.filename;
        } else if(this.isFilename(soundData.filename)) {
            soundData.location = this.SOUNDS_PATH+soundData.filename;
        }else{
            console.log("Filename not valid: "+soundData.filename);
        }
        return soundData;
    }

    private isURL(url:string) {
        return this.URL_PATTERN.test(url);
    }

    private isFilename(filename:string) {
        return this.SOUND_FILENAME_PATTERN.test(filename);
    }
}
