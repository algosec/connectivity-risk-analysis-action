FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY src src/
COPY icons icons/
COPY tsconfig.json .
RUN npm run build
# RUN echo $(ls -1 /usr/src/app)
RUN npm run package
# RUN echo $(ls -1 /usr/src/app)
RUN chmod +x dist/index.js
RUN npm link