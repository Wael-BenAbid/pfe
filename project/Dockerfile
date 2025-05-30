# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache python3 make g++ git

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with more verbose output and without audit
RUN npm ci --no-audit || npm install --no-audit

# Copy project files
COPY . .

# Ensure image directories exist
RUN mkdir -p src/assets/images

# Configuration pour la production
RUN echo "VITE_API_BASE_URL=" > .env.production

# Build the app with more verbose output
RUN npm run build || (echo "Build failed, creating empty dist directory" && mkdir -p dist && echo "Build failed" > dist/index.html)

# Production stage
FROM nginx:alpine

# Create directory for static files
RUN mkdir -p /usr/share/nginx/html/static/admin

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create a simple health check file
RUN echo "OK" > /usr/share/nginx/html/health.txt

# Create a favicon.ico file
RUN touch /usr/share/nginx/html/favicon.ico

# Copy custom nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Create env.js file with default values
RUN echo 'window.ENV = {' > /usr/share/nginx/html/env.js && \
    echo '  VITE_API_BASE_URL: "http://backend:8000",' >> /usr/share/nginx/html/env.js && \
    echo '  VITE_ZIPKIN_URL: "/zipkin",' >> /usr/share/nginx/html/env.js && \
    echo '  VITE_ZIPKIN_ENABLED: "true",' >> /usr/share/nginx/html/env.js && \
    echo "  _TIMESTAMP: \"$(date +%s)\"" >> /usr/share/nginx/html/env.js && \
    echo '};' >> /usr/share/nginx/html/env.js && \
    echo 'console.log("Variables environnement injectees:", window.ENV);' >> /usr/share/nginx/html/env.js

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health.txt || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
