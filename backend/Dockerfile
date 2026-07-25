# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY . .

# Expose API port
EXPOSE 5000

# Set production env
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]
