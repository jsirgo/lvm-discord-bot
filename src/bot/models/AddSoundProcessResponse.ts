export class AddSoundProcessResponse {
    success: boolean;
    errorMessage: String;

    constructor(success:boolean, errorMessage:String){
        this.success = success;
        this.errorMessage = errorMessage;
    }
}