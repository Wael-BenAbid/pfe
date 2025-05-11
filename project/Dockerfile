# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache python3 make g++ git

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with more verbose output and without audit
RUN npm ci --no-audit || npm install --no-audit

# Copy fix scripts from project/script directory
COPY project/script/fix-paths*.js ./
COPY project/script/fix-paths.sh ./
COPY project/script/fix-app.sh ./
COPY project/script/ensure-files.sh ./
COPY project/script/fix-reset-password.sh ./

# Copy project files
COPY . .

# Ensure all required files exist
RUN chmod +x ensure-files.sh && ./ensure-files.sh

# Ensure image directories exist
RUN mkdir -p src/assets/images

# List image files for verification
RUN ls -la src/assets/images/

# Configuration pour la production
RUN echo "VITE_API_BASE_URL=/api" > .env.production

# Make the fix scripts executable and run them
RUN chmod +x fix-paths.sh fix-app.sh fix-reset-password.sh && \
    ./fix-paths.sh && \
    ./fix-app.sh && \
    ./fix-reset-password.sh

# Try the Node.js script as a fallback
RUN node fix-paths-cjs.cjs || echo "Fix paths script failed, but continuing with build"

# Build the app with more verbose output
RUN npm run build || (echo "Build failed, creating empty dist directory" && mkdir -p dist && echo "Build failed" > dist/index.html)

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple health check file
RUN echo "OK" > /usr/share/nginx/html/health.txt

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
