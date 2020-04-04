# Sound Discord bot
## Greenlock config
*Only required if api and ssl is enabled.*
Set up required Greenlock config placing config.json in this folder. Example bellow:
```json
{ "sites": [{ "subject": "domain.example", "altnames": ["domain.example"] }] }
```
Where domain.example has to be the domain where the api will be available.

SSL certificates will be generated with Let's Encrypt using [greenlock-express](https://git.rootprojects.org/root/greenlock-express.js) **Note that to generate certificates some data might be shared with third parties, read greenlock-express doc and [Let’s Encrypt](https://letsencrypt.org/es/) for more info.**
ACME Subscriber Agreement: https://letsencrypt.org/documents/LE-SA-v1.2-November-15-2017.pdf
Greenlock/ACME.js Terms of Use: https://rootprojects.org/legal/#terms