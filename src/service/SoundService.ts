import { SoundData } from '../data/SoundData';
import Request from 'request';
import FS from 'fs';
import { SoundDataList } from '../data/SoundDataList';

export class SoundService {

    private readonly FILE_PATTERN:RegExp = /^(?!-)([aA-zZ0-1-]+-)?data\.json/;
    private readonly URL_PATTERN:RegExp = /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    private readonly SOUND_FILENAME_PATTERN:RegExp = /^[^/?*:;{}\\]+\.[^/?*:;{}\\]+$/;
    private readonly RESOURCES_PATH:string = "resources/";
    private readonly SOUNDS_PATH:string = "resources/sounds/";
    private readonly DEFAULT_DATA_FILE_NAME:string = "sound-data.json";
    private readonly DEFAULT_DATA_FILE_TITLE:string = "sound-data.json";

    private sounds:Array<SoundData>;

    constructor(){
        this.loadSounds();
    }

    public loadSounds(){
        FS.readdir(this.RESOURCES_PATH, (err, files) => {
            this.sounds = new Array<SoundData>();
            files.filter(file => file.match(this.FILE_PATTERN)).forEach(file => {
                let jsonString = FS.readFileSync(this.RESOURCES_PATH+file,'utf8');
                let dataList:SoundDataList = JSON.parse(jsonString);
                this.sounds = this.sounds.concat(dataList.sounds);
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

    public getSoundTextList():Array<SoundData>{
        return this.sounds;
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

    public addNewSound(url:string, text:string, tags:string):Promise<boolean> {
        let promise = new Promise<boolean>((resolve, reject) => {
            let tempName = url.split("/");
            let fileName = tempName[tempName.length-1];
            let sound:SoundData = {
                filename:fileName,
                text:text,
                tags:tags
            }
            console.log("Importing sound: "+JSON.stringify(sound));
            Request.get(url).on('error', (err) => {
                console.error("Error getting file from "+url+": "+err);
                resolve(false);
            }).pipe(FS.createWriteStream(this.SOUNDS_PATH+fileName).on('finish',() => {
                try{
                    this.appendSoundToJSONFile(sound);
                    console.log("Sound imported successfuly");
                    resolve(true);
                }catch(err){
                    console.log("Error imported sound");
                    resolve(false);
                }
            }));
        });
        return promise;
    }

    private appendSoundToJSONFile(sound:SoundData) {
        if(FS.existsSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME)){
            let data = FS.readFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME,'utf8');
            let soundDataList:SoundDataList = JSON.parse(data); 
            soundDataList.sounds.push(sound)
            let json = JSON.stringify(soundDataList); 
            try{
                FS.writeFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME, json);
            }catch(err){
                console.error("Error appending sound data to existing file: "+err);
                throw err;
            }
        }else{
            let soundDataList:SoundDataList = {
                title: this.DEFAULT_DATA_FILE_TITLE,
                sounds: [sound]
            }
            let json = JSON.stringify(soundDataList);
            try{
                FS.writeFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME, json);
            }catch(err){
                console.error("Error saving sound data file: "+err);
                throw err;
            }
        }
        this.loadSounds();
    }
}
