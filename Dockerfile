FROM node:10.15.0-alpine
COPY . /lvm-discord-bot
WORKDIR /lvm-discord-bot
RUN apk add --no-cache --quiet ffmpeg git python build-base
RUN git config --global core.compression 9
RUN npm install && npm run build && npm prune --production && rm -rf /lvm-discord-bot/src
CMD ["npm", "start"]