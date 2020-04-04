# Sound Discord bot
## Bot config
Set up bot placing config.json in this folder. Example bellow:
```json
{
    "token": "XXXXXXXXXXXX",
    "apienabled": true,
    "sslenabled": true,
    "tokenkey": "XXXXXXXXXXX",
    "mantaineremail": "example@email.com"
}
```
* token: Discord Developer Portal bot token
* apienabled: true or false to enable or not api
* sslenabled: true or false to enable or not ssl on api. *Extra config is needed to enable ssl --> [README.md](greenlock.d/README.md)*
* tokenkey: Key to generate api auth token
* mantaineremail: Mantainer email required by greenlock-express when enabling ssl on api

## API users config
Set up api users placing apiusers.json in this folder. Example bellow:
```json
{
    "users": [
        {
            "username": "user",
            "password": "password"
        },
        {
            "username": "user2",
            "password": "password2"
        }
    ]
}
```