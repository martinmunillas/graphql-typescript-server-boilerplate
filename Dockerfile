FROM node:14

COPY ["package.json", "/usr/src/"]

WORKDIR /usr/src

RUN yarn

COPY [".", "/usr/src/"]

EXPOSE 3000

CMD ["yarn", "dev"]