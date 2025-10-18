# Stage 0, "development-stage", for development with hot reloading
FROM node:25-alpine AS development-stage

WORKDIR /app

# Copy package files
COPY package*.json /app/

# Install all dependencies (including dev dependencies)
RUN npm install

# Build arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_URL

# Expose port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Default command for development (can be overridden)
CMD ["npm", "run", "dev"]

# Stage 1, "build-stage", based on Node.js, to build and compile the frontend
FROM node:25-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy source code
COPY ./ /app/

# Build arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_URL

# Build the Next.js application
RUN npm run build

# Stage 2, production stage with minimal Node.js runtime
FROM node:25-alpine AS production-stage

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json /app/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build-stage /app/.next ./.next
COPY --from=build-stage /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
