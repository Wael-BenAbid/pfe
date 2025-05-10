# Frontend Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache python3 make g++ git

# Copy package files and fix scripts
COPY package*.json ./
COPY fix-paths*.js ./
COPY fix-paths.sh ./
COPY fix-app.sh ./
COPY ensure-files.sh ./

# Install dependencies with more verbose output and without audit
RUN npm ci --verbose --no-audit || (echo "npm ci failed, trying npm install" && npm install --verbose --no-audit)

# Copy project files
COPY . .

# Ensure all required files exist
RUN chmod +x ensure-files.sh && ./ensure-files.sh

# Use backup App.tsx if needed
RUN if [ -f "src/App.tsx.backup" ]; then \
    cp src/App.tsx.backup src/App.tsx || true; \
    echo "Using backup App.tsx"; \
fi

# Configuration pour la production
RUN echo "VITE_API_BASE_URL=/api" > .env.production

# Check if node_modules exists and is not empty
RUN ls -la && ls -la node_modules || echo "node_modules not found or empty"

# Make the fix scripts executable and run them
RUN chmod +x fix-paths.sh fix-app.sh && ./fix-paths.sh && ./fix-app.sh

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
