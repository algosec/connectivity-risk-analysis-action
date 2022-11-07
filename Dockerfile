FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY src/cli.js ./
RUN chmod +x cli.js
RUN npm link