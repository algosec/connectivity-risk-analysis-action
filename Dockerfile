FROM node:16
RUN curl -L https://raw.githubusercontent.com/warrensbox/terraform-switcher/release/install.sh | bash
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY icons icons/
COPY src src/
COPY tsconfig.json .
RUN npm run build
# RUN echo $(ls -1 /usr/src/app)
RUN npm run package
# RUN echo $(ls -1 /usr/src/app)
RUN chmod +x dist/index.js
RUN npm link