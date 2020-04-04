FROM node:12.4.0-alpine

ARG token
ARG symbol="?"
ARG apienabled="false"
ARG sslenabled="false"
ARG username="admin"
ARG password="soundbot"
ARG domain="example.com"
ARG mantaineremail="example@email.com"

COPY . /sound-discord-bot
WORKDIR /sound-discord-bot

RUN apk add --no-cache --quiet ffmpeg python build-base pwgen openssl git && git config --global core.compression 9

RUN chmod 700 ./dockerSetUpScript.sh && \
    ./dockerSetUpScript.sh $symbol $token $apienabled `pwgen -Bs1 12` $username $password $sslenabled $mantaineremail $domain

RUN npm install && npm run build && npm prune --production && rm -rf /sound-discord-bot/src

CMD ["npm", "start"]