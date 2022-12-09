FROM node:17

RUN apt-get update
RUN apt-get -y install iputils-ping
RUN apt-get -y install postgresql-client
RUN apt-get -y install dnsutils

# Create app directory
WORKDIR /usr/src/app
CMD [ "mkdir", "/usr/src/app/logs" ]

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8000
