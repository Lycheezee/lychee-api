# Use Node base image
FROM node:23-alpine

ENV PORT 8080
ENV HOST 0.0.0.0

WORKDIR /srv
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080
CMD ["sh", "-c", "npm run build && npm start"]

