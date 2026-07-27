FROM node:20-slim

# Install system dependencies for language servers
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript language server
RUN npm install -g typescript typescript-language-server

# Install Python language server
RUN pip3 install --break-system-packages 'python-lsp-server[all]' || \
    pip3 install 'python-lsp-server[all]'

WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package*.json ./
RUN npm ci --production

# Copy application source
COPY src/ ./src/

# Non-root user for security
RUN groupadd -r lspuser && useradd -r -g lspuser lspuser
USER lspuser

EXPOSE 3001

CMD ["node", "src/index.js"]
