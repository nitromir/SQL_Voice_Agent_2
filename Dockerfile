FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]