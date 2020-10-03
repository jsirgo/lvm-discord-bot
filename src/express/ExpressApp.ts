import express, { Express, Router } from "express";
import * as bodyParser from "body-parser";
import * as jwt from "jsonwebtoken";
import config from "../config/config.json";
import userconfig from "../config/apiusers.json";
import { Bot } from "../bot/Bot";
import { VerifyErrors } from "jsonwebtoken";
import { BotData, Channel, Member, Role, Guild, User } from "../bot/models";
import { Sound, Config } from "../bot/interface";
import { Guild as DiscordGuild, Role as DiscordRole, VoiceChannel, GuildMember } from "discord.js";
import FS from "fs";
import cors from "cors";
import multer, { StorageEngine } from "multer";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const greenlock = require("greenlock-express");

export class ExpressApp {

    private readonly PORT:number = 53134;
    
    private app: Express;
    private privateRoutes: Router;
    private storage:StorageEngine;
    private upload:any;
    private users:User[];

    constructor (private bot: Bot) {
        this.users = userconfig.users;

        this.app = express();
        this.privateRoutes = express.Router();

        this.storage = multer.diskStorage({
            destination: function (req, file, cb) {
                const dest = "public/attachments/";
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

        this.app.set("key", (<Config>config).tokenkey);
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(cors({
            "allowedHeaders": ["Content-Type", "access-token"],
            "origin": "*",
            "preflightContinue": true
        }));
        this.app.use(express.static("public"));
        
        this.privateRoutes.use((req:any, res, next) => {
            let token:string = <string>req.headers["access-token"];
            if(!token && req.query && req.query.kt){
                token = req.query.kt;
            }
            if (token) {
                jwt.verify(token, this.app.get("key"), (err: VerifyErrors, decoded: any) => {      
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

        this.setUpEndpoints();
    }

    public start(): void{

        if((<Config>config).tokenkey == null || (<Config>config).tokenkey.length <= 0){
            console.error("Error starting WS: Token key must be set in config.json");
            return;
        }
        if((<Config>config).mantaineremail == null || (<Config>config).mantaineremail.length <= 0){
            console.error("Error starting WS: Mantainer email must be set in config.json");
            return;
        }
        if(this.users == null || this.users.length <= 0){
            console.error("Error starting WS: At least one user must be set in config.json");
            return;
        }
        
        if((<Config>config).sslenabled != null && (<Config>config).sslenabled){
            greenlock.init({
                packageRoot: `${__dirname}/../../`,
                configDir: "./greenlock.d",
                maintainerEmail: (<Config>config).mantaineremail,
                cluster: false
            }).serve(this.app);
        }else{
            this.app.listen(this.PORT, () => {
                console.log("HTTP Server running on port " + this.PORT);
            });
        }
    }

    private setUpEndpoints(): void{
        this.app.post("/user/authenticate", (req, res) => {
            if(this.validateUser(req.body.username, req.body.password)) {
                const payload = {
                    check:  true
                };
                const token = jwt.sign(payload, this.app.get("key"), {
                    expiresIn: 86400
                });
                res.json({
                    mensaje: "Succesful authentication",
                    token: token,
                    username: req.body.username,
                });
            } else {
                res.status(401).send({ error: "Wrong username or password" });
            }
        });

        this.app.get("/bot", this.privateRoutes, (req, res) => {
            const sounds:Sound[] = this.bot.getSoundService().getSounds();
            const guilds:DiscordGuild[] = this.bot.getBotGuilds();
            if(sounds != null && guilds != null){
                const botData = new BotData();
                 // At the moment expecting only one guild
                 const guild = guilds[0];
                botData.guild = this.discordGuild2Guild(guild);
                botData.sounds = sounds;
               
                const voiceChannels:Channel[] = guild.channels.cache.filter(channel => channel.type == "voice")
                    .map(channel => this.voiceChannel2Channel(<VoiceChannel>channel));
                botData.voiceChannels = voiceChannels;
                res.json(botData);
            }else{
                res.status(400).send({ error: "Error reading bot data" });
            }
            
        });

        this.app.post("/sound/play", this.privateRoutes, (req, res) => {
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

        this.app.post("/sound/add", this.privateRoutes, this.upload.single("file"), (req, res) => {
            // TODO get user, check role and set user in new sound
            if(this.isValidAddSoundRequest(req)) {
                const response = this.bot.getSoundService().addNewSoundFile(req.body.text, req.body.tags, req.file);
                if(response.success){
                    res.json({ mensaje: "Sound added successfuly"});
                }else{
                    res.status(500).send({ error: "Error adding sound" });
                }
                try {
                    FS.unlinkSync(req.file.path);
                } catch(err) {
                    console.error("Error deleting attachment file: " + req.file.path);
                }
            }else{
                res.status(400).send({ error: "Error adding sound" });
            }
        });

        this.app.get("/sound/:filename", this.privateRoutes, (req, res) => {
            const filename = req.params.filename;
            res.download("./resources/sounds/" + filename);
        });
    }

    private isValidAddSoundRequest(req:any): boolean{
        return req.body.text != null && req.body.text.length > 0 
        && req.body.tags != null && req.body.tags.length > 0
        && req.file != null;
    }

    private validateUser(username: string, password: string): boolean {
        return this.users.findIndex(user => user.username === username && user.password === password) >= 0;
    }

    private voiceChannel2Channel(voiceChannel: VoiceChannel): Channel{
        const channel = new Channel();
        channel.id = voiceChannel.id;
        channel.members = voiceChannel.members.map(member => this.guildMember2Member(member));
        channel.name = voiceChannel.name;
        channel.parentID = voiceChannel.parentID;
        return channel;
    }

    private guildMember2Member(guildMember: GuildMember): Member{
        const member = new Member();
        member.id = guildMember.id;
        member.joinedAt = guildMember.joinedAt;
        member.username = guildMember.user.username;
        member.roles = guildMember.roles.cache.map(role => this.discordRole2Role(role));
        return member;
    }

    private discordRole2Role(discordRole:DiscordRole): Role{
        const role = new Role();
        role.id = discordRole.id;
        role.name = discordRole.name;
        return role;
    }

    private discordGuild2Guild(discordGuild:DiscordGuild): Guild{
        const guild = new Guild();
        guild.id = discordGuild.id;
        guild.name = discordGuild.name;
        guild.ownerID= discordGuild.ownerID;
        guild.description= discordGuild.description;
        guild.banner= discordGuild.banner;
        return guild;
    }
}