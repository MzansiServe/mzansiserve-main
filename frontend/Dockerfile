FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* bun.lockb* ./
# We'll use npm since package-lock.json exists
RUN npm ci || npm install

# Copy source code
COPY . .

# Expose Vite default port
EXPOSE 8080

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
