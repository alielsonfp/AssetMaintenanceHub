
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Se você estiver usando React ou outro framework com um servidor de desenvolvimento
EXPOSE 3000

# Para aplicativos React
CMD ["npm", "start"]