# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Inject build-time environment variables for CRA
ARG REACT_APP_STUN_URLS
ARG REACT_APP_TURN_URLS
ARG REACT_APP_TURN_USERNAME
ARG REACT_APP_TURN_PASSWORD

ENV REACT_APP_STUN_URLS=${REACT_APP_STUN_URLS}
ENV REACT_APP_TURN_URLS=${REACT_APP_TURN_URLS}
ENV REACT_APP_TURN_USERNAME=${REACT_APP_TURN_USERNAME}
ENV REACT_APP_TURN_PASSWORD=${REACT_APP_TURN_PASSWORD}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
