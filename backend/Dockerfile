FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
# Install dependencies
# Using --force to bypass potential peer dependency issues
RUN npm install --force

# Copy the rest of the application code
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]
