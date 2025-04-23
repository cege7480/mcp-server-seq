# Use node:20 as the base image
FROM node:20

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the project
RUN npm run build

# Set the entry point to build/seq-server.js
CMD ["node", "build/seq-server.js"]
