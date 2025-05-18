# Use Node base image
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
COPY tsconfig.json ./
COPY . .

# Install dependencies
RUN npm install

# Build the project
RUN npm run build

# Expose port (Cloud Run default)
EXPOSE 8080

# Start the app
CMD ["node", "dist/app.js"]
