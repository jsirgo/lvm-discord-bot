export class SoundData {

    private readonly SOUNDS_PATH:string = "resources/sounds/";

    filename:string;
    text:string;
    tags:string;

    constructor(sound:any){
        this.filename = sound.filename;
        this.text = sound.text;
        this.tags = sound.tags;
    }

    public getSoundUrl():string{
        return this.SOUNDS_PATH + this.filename;
    }
}