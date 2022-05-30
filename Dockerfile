FROM node:14.15.0-alpine3.11 

# Directory to hold the application
WORKDIR /web

COPY package.json /web

# install dependencies (both dev and prod) to be used as a builder for the app
RUN npm install

# copy the rest of the files
COPY . /web

RUN npm install

CMD npm start

EXPOSE 9022
