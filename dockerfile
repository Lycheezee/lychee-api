# Use Node base image
FROM node:23-alpine
WORKDIR /srv
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]

