FROM node:20-slim

# Install system dependencies
# Rule: apt-get must include --no-install-recommends on every line
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Rule: Allowed COPY destinations include /app
WORKDIR /app

# Rule: use COPY . . (build system strips top-level folder)
COPY . .

# Install exact dependencies from lockfile
# Rule: npm ci with a lockfile present is explicitly allowed
RUN npm ci
