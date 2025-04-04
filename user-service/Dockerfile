FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

# Installation des dépendances requises pour bcrypt
RUN apk --no-cache add --virtual builds-deps build-base python3 && \
    apk --no-cache add g++ make py3-pip && \
    apk add --no-cache --virtual .gyp python3 make g++

# Installation des dépendances Node.js
RUN npm install bcrypt --build-from-source && \
    npm install

COPY . .

# Exposer le port 3005 (mis à jour depuis 3001)
EXPOSE 3005

CMD ["node", "index.js"] 