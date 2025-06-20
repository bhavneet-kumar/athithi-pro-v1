# React Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --force

# Copy the rest of the application code
COPY . .
RUN npm run build

# Serve build using a simple static server
RUN npm install -g serve

EXPOSE 8080
CMD ["serve", "-s", "build", "-l", "8080"]
