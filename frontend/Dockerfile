# 🎨 Frontend Dockerfile
# This builds our React app and serves it

FROM node:20-alpine

# Set where we'll work inside the container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install all the packages our app needs
RUN npm install

# Copy all our code
COPY . .

# The port our app will run on
EXPOSE 3000

# Start the development server with host flag for Docker
CMD ["npm", "run", "dev", "--", "--host"]
