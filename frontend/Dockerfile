# Stage 1: Base
FROM node:18-alpine

WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./

# Install deps
RUN npm install

# Copy rest of the app
COPY . .

# Expose port
EXPOSE 3000

# Start Next.js in dev mode
CMD ["npm", "run", "dev"]
