import { User } from "../models";

export interface Config {
    token:string,
    botSymbol?:string,
    wsenabled?:boolean,
    sslenabled?:false,
    tokenkey?:string,
    certkey?:string,
    wsusers?:User[]
}