import express, { Express, Router } from "express";
import * as bodyParser from 'body-parser';
import * as jwt from 'jsonwebtoken';
import config from './config/config.json';
import { Bot } from "./Bot";
import { VerifyErrors } from "jsonwebtoken";
import { BotData, Channel, Member, Role } from "./models";
import { Sound, Config } from "./interface";
import { Guild, Role as DiscordRole, VoiceChannel, GuildMember } from "discord.js";
import FS from 'fs';
import https from 'https';
import cors from 'cors';
import multer, { StorageEngine, Instance } from 'multer';

export class ExpressApp {

    private readonly PORT:number = 53134;
    
    private app: Express;
    private privateRoutes: Router;
    private storage:StorageEngine;
    private upload:Instance;

    constructor (private bot: Bot) {}

    public start() {
        if((<Config>config).tokenkey == null || (<Config>config).tokenkey.length <= 0){
            console.error("Error starting WS: Token key must be set in config.json");
            return;
        }
        if((<Config>config).certkey == null || (<Config>config).certkey.length <= 0){
            console.error("Error starting WS: Cert key must be set in config.json");
            return;
        }
        if((<Config>config).wsusers == null || (<Config>config).wsusers.length <= 0){
            console.error("Error starting WS: At least one user must be set in config.json");
            return;
        }
        this.app = express();
        this.privateRoutes = express.Router();

        this.storage = multer.diskStorage({
            destination: function (req, file, cb) {
                var dest = 'public/attachments/';
                if (!FS.existsSync(dest)){
                    FS.mkdirSync(dest, { recursive: true });
                }
                cb(null, dest);
            },
            filename: function (req, file, cb) {
                cb(null, Date.now() + file.originalname);
            }
        });
        this.upload = multer({ storage: this.storage });

        this.app.set('key', (<Config>config).tokenkey);
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(cors({
            'allowedHeaders': ['Content-Type', 'access-token'],
            'origin': '*',
            'preflightContinue': true
        }));
        this.app.use(express.static('public'));
        
        this.privateRoutes.use((req:any, res, next) => {
            let token:string = <string>req.headers['access-token'];
            if (token) {
                jwt.verify(token, this.app.get('key'), (err:VerifyErrors, decoded:string) => {      
                    if (err) {
                        return res.status(401).send({ error: "Invalid Token" });
                    } else {
                        req.decoded = decoded;    
                        next();
                    }
                });
            } else {
                res.status(401).send({ error: "Missing Token" });
            }
        });

        this.app.post('/users/authenticate', (req, res) => {
            if(this.validateUser(req.body.username, req.body.password)) {
                const payload = {
                    check:  true
                };
                const token = jwt.sign(payload, this.app.get('key'), {
                    expiresIn: 1440
                });
                res.json({
                    mensaje: 'Succesful authentication',
                    token: token,
                    username: req.body.username,
                });
            } else {
                res.status(401).send({ error: "Wrong username or password" });
            }
        });
        
        this.app.get('/bot', this.privateRoutes, (req, res) => {
            let sounds:Sound[] = this.bot.getSoundService().getSounds();
            let guilds:Guild[] = this.bot.getBotGuilds();
            if(sounds != null && guilds != null){
                let botData = new BotData();
                botData.sounds = sounds;
                // At the moment expecting only one guild
                let voiceChannels:Channel[] = guilds[0].channels.filter(channel => channel.type == 'voice')
                    .map(channel => this.voiceChannel2Channel(<VoiceChannel>channel));
                botData.voiceChannels = voiceChannels;
                res.json(botData);
            }else{
                res.status(400).send({ error: "Error reading bot data" });
            }
            
        });

        this.app.post('/play-sound', this.privateRoutes, (req, res) => {
            if(req.body.fileName != null && req.body.fileName.length > 0 && req.body.channelId != null && req.body.channelId.length > 0) {
                if(this.bot.playSoundInChannel(req.body.fileName, req.body.channelId)){
                    res.json({ mensaje: "Sound played successfuly"});
                }else{
                    res.status(500).send({ error: "Error playing sound" });
                }
            }else{
                res.status(400).send({ error: "Error playing sound" });
            }
        });

        this.app.post('/add-sound', this.privateRoutes, this.upload.single('file'), (req, res) => {
            if(req.body.text != null && req.body.text.length > 0 
                && req.body.tags != null && req.body.tags.length > 0
                && req.file != null) {
                let response = this.bot.getSoundService().addNewSoundFile(req.body.text, req.body.tags, req.file);
                if(response.success){
                    res.json({ mensaje: "Sound added successfuly"});
                }else{
                    try {
                        FS.unlinkSync(req.file.path);
                    } catch(err) {
                        console.error("Error deleting attachment file: " + req.file.path);
                    }
                    res.status(500).send({ error: "Error adding sound" });
                }
            }else{
                res.status(400).send({ error: "Error adding sound" });
            }
        });

        if((<Config>config).sslenabled != null && (<Config>config).sslenabled){
            https.createServer({
                key: FS.readFileSync('key.pem'),
                cert: FS.readFileSync('cert.pem'),
                passphrase: (<Config>config).certkey,
            }, this.app).listen(this.PORT, () => {
                console.log('HTTPS Server running on port ' + this.PORT);
            });
        }else{
            this.app.listen(this.PORT, () => {
                console.log('HTTP Server running on port ' + this.PORT);
            });
        }
    }

    private validateUser(username: string, password: string): boolean {
        return (<Config>config).wsusers.findIndex(user => user.username === username && user.password === password) >= 0;
    }

    private voiceChannel2Channel(voiceChannel: VoiceChannel): Channel{
        let channel = new Channel();
        channel.id = voiceChannel.id;
        channel.members = voiceChannel.members.map(member => this.guildMember2Member(member));
        channel.name = voiceChannel.name;
        channel.parentID = voiceChannel.parentID;
        return channel;
    }

    private guildMember2Member(guildMember: GuildMember): Member{
        let member = new Member();
        member.id = guildMember.id;
        member.joinedAt = guildMember.joinedAt;
        member.nickname = guildMember.nickname;
        member.roles = guildMember.roles.map(role => this.discordRole2Role(role));
        return member;
    }

    private discordRole2Role(discordRole:DiscordRole): Role{
        let role = new Role();
        role.id = discordRole.id;
        role.name = discordRole.name;
        return role;
    }
}