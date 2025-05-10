# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies with more verbose output and without audit
RUN npm ci --verbose --no-audit || (echo "npm ci failed, trying npm install" && npm install --verbose --no-audit)

# Copy project files
COPY . .

# Configuration pour la production
RUN echo "VITE_API_BASE_URL=/api" > .env.production

# Check if node_modules exists and is not empty
RUN ls -la && ls -la node_modules || echo "node_modules not found or empty"

# Make the fix-paths.sh script executable and run it
RUN chmod +x fix-paths.sh && ./fix-paths.sh

# Try the Node.js script as a fallback
RUN node fix-paths-cjs.js || echo "Fix paths script failed, but continuing with build"

# List files to verify changes
RUN find src -name "*.tsx" | xargs grep -l "assets/images/logo.png" || echo "No files found with logo.png references"

# Build the app with more verbose output
RUN npm run build --verbose || (echo "Build failed, showing more details" && npm run build --verbose -- --debug)

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
