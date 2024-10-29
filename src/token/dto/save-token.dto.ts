export class SaveTokenDto{
    readonly userId: number;
    readonly refreshToken:string;
    readonly deviceId?:string

}