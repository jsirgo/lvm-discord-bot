FROM node:12.4.0-alpine
COPY . /lvm-discord-bot
WORKDIR /lvm-discord-bot
ARG token
RUN apk add --no-cache --quiet ffmpeg python build-base git && git config --global core.compression 9
# Get sounds from dmcallejo/lavidamoderna_bot project https://github.com/dmcallejo/lavidamoderna_bot
RUN chmod +x ./get-sounds.sh && ./get-sounds.sh && echo "{\"token\":\""$token"\"}" > src/config/config.json
RUN npm install && npm run build && npm prune --production && rm -rf /lvm-discord-bot/src
CMD ["npm", "start"]