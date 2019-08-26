FROM node:alpine

WORKDIR /app

ADD . /app

RUN npm install
RUN npm install -g pm2