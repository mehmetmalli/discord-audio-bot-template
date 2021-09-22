FROM node

RUN apt update

RUN apt install ffmpeg -y

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENTRYPOINT [ "npm", "run", "start" ]