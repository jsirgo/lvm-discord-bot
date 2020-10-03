import Request from "request";
import FS from "fs";
import { SoundList, Sound } from "../interface";
import { AddSoundProcessData, AddSoundProcessResponse } from "../models";

export class SoundService {

    private readonly FILE_PATTERN:RegExp = /^(?!-)([aA-zZ0-1-]+-)?data\.json/;
    private readonly URL_PATTERN:RegExp = /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    private readonly SOUND_FILENAME_PATTERN:RegExp = /^[^/?*:;{}\\]+\.[^/?*:;{}\\]+$/;
    private readonly RESOURCES_PATH:string = "resources/";
    private readonly SOUNDS_PATH:string = "resources/sounds/";
    private readonly DEFAULT_DATA_FILE_NAME:string = "sound-data.json";
    private readonly DEFAULT_DATA_FILE_TITLE:string = "sound-data.json";

    private sounds:Array<Sound>;

    private addSoundBussy = false;

    constructor(){
        this.loadSounds();
    }

    public loadSounds(): void{
        FS.readdir(this.RESOURCES_PATH, (err, files) => {
            this.sounds = new Array<Sound>();
            files.filter(file => file.match(this.FILE_PATTERN)).forEach(file => {
                const jsonString = FS.readFileSync(this.RESOURCES_PATH+file,"utf8");
                const dataList:SoundList = JSON.parse(jsonString);
                this.sounds = this.sounds.concat(dataList.sounds);
                console.log("Loaded "+file+" data file");
            });
        });
    }

    public getRandomSound(): Sound {
        const randomIndex = Math.floor(Math.random() * this.sounds.length);
        return this.setSoundLocation(this.sounds[randomIndex]);
    }

    public getSound(soundName: string): Sound {
        const matchSounds = this.sounds.filter((sound:Sound) => sound.tags.toLowerCase().includes(soundName.toLowerCase()));
        if (matchSounds != null && matchSounds.length > 0) {
            if (matchSounds.length == 1) {
                return this.setSoundLocation(matchSounds[0]);
            }
            else {
                const randomIndex = Math.floor(Math.random() * matchSounds.length);
                return this.setSoundLocation(matchSounds[randomIndex]);
            }
        }
        return null;
    }

    public getSoundByFileName(fileName: string): Sound {
        const sound = this.sounds.find((sound:Sound) => sound.filename == fileName);
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

    private isURL(url:string): boolean{
        return this.URL_PATTERN.test(url);
    }

    private isFilename(filename:string): boolean{
        return this.SOUND_FILENAME_PATTERN.test(filename);
    }

    public addNewSound(addSoundProcessData:AddSoundProcessData):Promise<AddSoundProcessResponse> {
        const promise = new Promise<AddSoundProcessResponse>((resolve) => {
            if(this.addSoundBussy){
                console.error("Error importing sound: Other add sound sound request is being processed");
                resolve(new AddSoundProcessResponse(false, "Error importing sound: Other add sound sound request is being processed, retry later."));
            }else{
                this.addSoundBussy = true;
                const tempName = addSoundProcessData.getFileUrl().split("/");
                const fileName = tempName[tempName.length-1];
                try{
                    if (FS.existsSync(this.SOUNDS_PATH+fileName)) {
                        this.addSoundBussy = false;
                        console.error("Error importing sound: A file with this name already exists");
                        const response = new AddSoundProcessResponse(false, "Error importing sound: A file whith this name already exists");
                        resolve(response);
                    }else{
                        const sound:Sound = {
                            filename: fileName,
                            text: addSoundProcessData.getText(),
                            tags: addSoundProcessData.getTags()
                        };
                        console.log("Importing sound: "+JSON.stringify(sound));
                        Request.get(addSoundProcessData.getFileUrl()).on("error", (err) => {
                            this.addSoundBussy = false;
                            console.error("Error getting file from "+addSoundProcessData.getFileUrl()+": "+err);
                            const response = new AddSoundProcessResponse(false, "Error getting file from "+addSoundProcessData.getFileUrl());
                            resolve(response);
                        }).pipe(FS.createWriteStream(this.SOUNDS_PATH+fileName).on("finish",() => {
                            try{
                                this.appendSoundToJSONFile(sound);
                                this.addSoundBussy = false;
                                console.log("Sound imported successfuly");
                                const response = new AddSoundProcessResponse(true, null);
                                resolve(response);
                            }catch(err){
                                this.addSoundBussy = false;
                                console.error("Error importing sound" + JSON.stringify(err));
                                const response = new AddSoundProcessResponse(false, "Error importing sound");
                                resolve(response);
                            }
                        }));
                    }
                }catch(err){
                    this.addSoundBussy = false;
                    console.error("Error importing sound" + JSON.stringify(err));
                    const response = new AddSoundProcessResponse(false, "Error importing sound");
                    resolve(response);
                }
            } 
        });
        return promise;
    }

    public addNewSoundFile(text:string, tags:string, file: Express.Multer.File):AddSoundProcessResponse {
        if(this.addSoundBussy){
            console.error("Error importing sound: Other add sound sound request is being processed");
            return new AddSoundProcessResponse(false, "Error importing sound: Other add sound sound request is being processed, retry later.");
        }
        this.addSoundBussy = true;
        try{
            const fileName = file.originalname;
            if (FS.existsSync(this.SOUNDS_PATH+fileName)) {
                this.addSoundBussy = false;
                console.error("Error importing sound: A file with this name already exists");
                return new AddSoundProcessResponse(false, "Error importing sound: A file whith this name already exists");
            }else{
                const sound:Sound = {
                    filename: fileName,
                    text: text,
                    tags: tags
                };
                console.log("Importing sound: "+JSON.stringify(sound));
                this.copyFile(file.path, this.SOUNDS_PATH+fileName);

                this.appendSoundToJSONFile(sound);

                this.addSoundBussy = false;

                console.log("Sound imported successfuly");
                return new AddSoundProcessResponse(true, null);
            }
        }catch(err){
            this.addSoundBussy = false;
            console.error("Error importing sound" + JSON.stringify(err));
            return new AddSoundProcessResponse(false, "Error importing sound");
        } 
    }

    private copyFile(filePath:string, newFilePath:string): void{
        const readStream = FS.createReadStream(filePath);
        const writeStream = FS.createWriteStream(newFilePath);

        readStream.pipe(writeStream);
    }

    private appendSoundToJSONFile(sound:Sound): void{
        if(FS.existsSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME)){
            const data = FS.readFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME,"utf8");
            const soundDataList:SoundList = JSON.parse(data); 
            soundDataList.sounds.push(sound);
            const json = JSON.stringify(soundDataList); 
            try{
                FS.writeFileSync(this.RESOURCES_PATH+this.DEFAULT_DATA_FILE_NAME, json);
            }catch(err){
                console.error("Error appending sound data to existing file: "+err);
                throw err;
            }
        }else{
            const soundDataList:SoundList = {
                title: this.DEFAULT_DATA_FILE_TITLE,
                sounds: [sound]
            };
            const json = JSON.stringify(soundDataList);
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
