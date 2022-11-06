FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY src src/
COPY icons icons/
COPY tsconfig.json .
RUN npm run build
RUN npm run package
CMD [ "node", "dist/index.js" ]