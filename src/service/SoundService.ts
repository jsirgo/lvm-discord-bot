import Request from 'request';
import FS from 'fs';
import { SoundList, Sound } from '../interface';
import { AddSoundProcessData, AddSoundProcessResponse } from '../models';

export class SoundService {

    private readonly FILE_PATTERN:RegExp = /^(?!-)([aA-zZ0-1-]+-)?data\.json/;
    private readonly URL_PATTERN:RegExp = /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    private readonly SOUND_FILENAME_PATTERN:RegExp = /^[^/?*:;{}\\]+\.[^/?*:;{}\\]+$/;
    private readonly RESOURCES_PATH:string = "resources/";
    private readonly SOUNDS_PATH:string = "resources/sounds/";
    private readonly DEFAULT_DATA_FILE_NAME:string = "sound-data.json";
    private readonly DEFAULT_DATA_FILE_TITLE:string = "sound-data.json";

    private sounds:Array<Sound>;

    constructor(){
        this.loadSounds();
    }

    public loadSounds(){
        FS.readdir(this.RESOURCES_PATH, (err, files) => {
            this.sounds = new Array<Sound>();
            files.filter(file => file.match(this.FILE_PATTERN)).forEach(file => {
                let jsonString = FS.readFileSync(this.RESOURCES_PATH+file,'utf8');
                let dataList:SoundList = JSON.parse(jsonString);
                this.sounds = this.sounds.concat(dataList.sounds);
                console.log("Loaded "+file+" data file");
            });
        });
    }

    public getRandomSound(): Sound {
        let randomIndex = Math.floor(Math.random() * this.sounds.length);
        return this.setSoundLocation(this.sounds[randomIndex]);
    }

    public getSound(soundName: string): Sound {
        let matchSounds = this.sounds.filter((sound:Sound) => sound.tags.toLowerCase().includes(soundName.toLowerCase()));
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

    public getSoundByFileName(fileName: string): Sound {
        let sound = this.sounds.find((sound:Sound) => sound.filename == fileName);
        if (sound == null) {
            console.log("Can´t get sound by filename: " + fileName);
            return null;
        }else{
            return this.setSoundLocation(sound);
        }
    }

    public getSounds():Array<Sound>{
        return this.sounds;
    }

    private setSoundLocation(soundData:Sound):Sound{
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

    public addNewSound(addSoundProcessData:AddSoundProcessData):Promise<AddSoundProcessResponse> {
        let promise = new Promise<AddSoundProcessResponse>((resolve, reject) => {
            let tempName = addSoundProcessData.getFileUrl().split("/");
            let fileName = tempName[tempName.length-1];
            try{
                if (FS.existsSync(this.SOUNDS_PATH+fileName)) {
                    console.log("Error importing sound: A file with this name already exists");
                    let response = new AddSoundProcessResponse(false, "Error importing sound: A file whith this name already exists");
                    resolve(response);
                }else{
                    let sound:Sound = {
                        filename: fileName,
                        text: addSoundProcessData.getText(),
                        tags: addSoundProcessData.getTags()
                    }
                    console.log("Importing sound: "+JSON.stringify(sound));
                    Request.get(addSoundProcessData.getFileUrl()).on('error', (err) => {
                        console.error("Error getting file from "+addSoundProcessData.getFileUrl()+": "+err);
                        let response = new AddSoundProcessResponse(false, "Error getting file from "+addSoundProcessData.getFileUrl());
                        resolve(response);
                    }).pipe(FS.createWriteStream(this.SOUNDS_PATH+fileName).on('finish',() => {
                        try{
                            this.appendSoundToJSONFile(sound);
                            console.log("Sound imported successfuly");
                            let response = new AddSoundProcessResponse(true, null);
                            resolve(response);
                        }catch(err){
                            console.error("Error importing sound");
                            let response = new AddSoundProcessResponse(false, "Error importing sound");
                            resolve(response);
                        }
                    }));
                }
            }catch(err){
                console.error("Error importing sound");
                let response = new AddSoundProcessResponse(false, "Error importing sound");
                resolve(response);
            } 
        });
        return promise;
    }

    public addNewSoundFile(text:string, tags:string, file:any):AddSoundProcessResponse {
            let fileName = file.originalname;
            try{
                if (FS.existsSync(this.SOUNDS_PATH+fileName)) {
                    console.log("Error importing sound: A file with this name already exists");
                    return new AddSoundProcessResponse(false, "Error importing sound: A file whith this name already exists");
                }else{
                    let sound:Sound = {
                        filename: fileName,
                        text: text,
                        tags: tags
                    }
                    console.log("Importing sound: "+JSON.stringify(sound));
                    FS.renameSync(file.path, this.SOUNDS_PATH+fileName);
                    this.appendSoundToJSONFile(sound);
                    console.log("Sound imported successfuly");
                    return new AddSoundProcessResponse(true, null);
                }
            }catch(err){
                console.error("Error importing sound");
                return new AddSoundProcessResponse(false, "Error importing sound");
            } 
    }

    private appendSoundToJSONFile(sound:Sound) {
        if(FS.existsSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME)){
            let data = FS.readFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME,'utf8');
            let soundDataList:SoundList = JSON.parse(data); 
            soundDataList.sounds.push(sound)
            let json = JSON.stringify(soundDataList); 
            try{
                FS.writeFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME, json);
            }catch(err){
                console.error("Error appending sound data to existing file: "+err);
                throw err;
            }
        }else{
            let soundDataList:SoundList = {
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
