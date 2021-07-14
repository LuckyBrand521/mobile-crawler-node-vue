FROM keymetrics/pm2:latest-alpine

WORKDIR /app
COPY package*.json ./
COPY pm2.json ./
RUN npm install
COPY ./ ./

CMD [ "pm2-runtime", "start", "pm2.json" ]
