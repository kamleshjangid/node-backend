# Use Node.js LTS version as the base image
FROM node:20

# Install tzdata for timezone configuration
RUN apt-get update && apt-get install -y tzdata

# Set the timezone as an environment variable
ENV TZ=Australia/Sydney
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Set the working directory in the container
WORKDIR /app

# Default environment variables (will be overridden at runtime)
ENV PORT=7002 \
    DATABASE_NAME=defaultdb \
    ALLOW_ORIGIN=* \
    DATABASE_USERNAME=defaultuser \
    DATABASE_PASSWORD=defaultpass \
    HOST=localhost \
    DB_PORT=5432

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project to the container
COPY . .

# Expose the port for the Node.js application
EXPOSE 7002

# Start the Node.js application
CMD ["npm", "start"]
