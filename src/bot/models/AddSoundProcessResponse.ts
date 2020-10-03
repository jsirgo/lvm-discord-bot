export class AddSoundProcessResponse {
    success: boolean;
    errorMessage: string;

    constructor(success:boolean, errorMessage:string){
        this.success = success;
        this.errorMessage = errorMessage;
    }
}