# Sound Discord bot
## Sounds and sound data configuration
This folder must contain the sounds used by the bot and also the json files that contain the data regarding the sounds. 

### Include sound files to the project
The sound files should be included in resources/sounds folder. To include sounds from a url, it only needed to cofigure it in the data.json file, see below.

### Configure sounds in data.json
The data regarding this sounds has to be set in a data.json file, there can be several data.json files, all that match the following pattern will be loaded:
```
^(?!-)([aA-zZ0-1-]+-)?data\.json
```

**data.json files format should be the following:**
```json
{
  "title": "Title of the data collection",
  "sounds": [
    {
      "filename": "soundfile.ogg",
      "text": "Text describing the sound",
      "tags": "tags related to the song separated by blank spaces"
    }
  ]
}
```

The sound filename could be an url but is preferable to have the sounds stored locally in remote/sounds.

**The structure has to be the following:**
resources/
├── sounds/
│   ├── soundAAA.ogg
│   ├── soundBBB.ogg
│   ├── ...
├── data.json
├── aaa-data.json
└── ...

