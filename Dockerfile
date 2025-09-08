# Use the latest official Deno image as base
FROM denoland/deno:latest

# Install essential packages for health checks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the dependency files first (for better caching)
COPY deno.json ./
COPY deno.lock* ./

# Cache dependencies
RUN deno cache --reload deno.json

# Copy the rest of the application
COPY . .

# Copy environment file
COPY .env .env

# Cache the main application
RUN deno cache server.ts

# Expose the port the app runs on
EXPOSE 8000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Create a non-root user for security
RUN groupadd -r denouser && useradd -r -g denouser denouser
RUN chown -R denouser:denouser /app
USER denouser

# Command to run the application
CMD ["deno", "run", "--allow-all", "server.ts"]
