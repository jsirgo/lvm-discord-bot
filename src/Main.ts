import { Bot } from "./bot/Bot";
import config from "./config/config.json";
import { ExpressApp } from "./express/ExpressApp";
import { Config } from "./bot/interface";

const bot: Bot = new Bot();
let expressApp: ExpressApp;

bot.start().then(() => {
    if((<Config>config).apienabled != null && (<Config>config).apienabled){
        console.log("WS enabled, starting express app");
        expressApp = new ExpressApp(bot);
        expressApp.start();
    }
});
