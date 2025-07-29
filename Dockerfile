# Use the latest official Deno image as base
FROM denoland/deno:latest

# Set the working directory
WORKDIR /app

# Copy the dependency files first (for better caching)
COPY deno.json ./

# Cache dependencies (skip lockfile for Docker build)
RUN deno cache --reload deno.json

# Copy the rest of the application
COPY . .

# Cache the main application
RUN deno cache server.ts

# Expose the port the app runs on
EXPOSE 8000

# Create a non-root user for security
RUN groupadd -r denouser && useradd -r -g denouser denouser
RUN chown -R denouser:denouser /app
USER denouser

# Command to run the application
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "server.ts"]
