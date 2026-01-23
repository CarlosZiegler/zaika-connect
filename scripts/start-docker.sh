#!/bin/bash
#
# Start Docker MinIO and TanStack Start Application
#
# This script:
# 1. Starts MinIO via Docker Compose
# 2. Waits for MinIO to be healthy
# 3. Creates the bucket if needed
# 4. Builds the application
# 5. Uploads client assets to MinIO
# 6. Starts the backend server
#
# Usage:
#   ./scripts/start-docker.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Bun installed
#   - .env file configured with MinIO settings

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check for required tools
check_requirements() {
  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
  fi

  if ! command -v bun &> /dev/null; then
    log_error "Bun is not installed. Please install Bun first."
    exit 1
  fi

  if [ ! -f ".env" ]; then
    log_error ".env file not found. Copy .env.example to .env and configure MinIO settings."
    exit 1
  fi
}

# Load environment variables
load_env() {
  set -a
  source .env
  set +a
}

# Start MinIO
start_minio() {
  log_info "Starting MinIO..."
  docker compose up -d minio

  log_info "Waiting for MinIO to be healthy..."
  local max_attempts=30
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if curl -sf "http://localhost:9000/minio/health/live" > /dev/null 2>&1; then
      log_info "MinIO is healthy!"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  log_error "MinIO failed to start within ${max_attempts} seconds"
  exit 1
}

# Create bucket using MinIO Client (mc)
create_bucket() {
  local bucket="${S3_BUCKET:-app-assets}"
  log_info "Ensuring bucket '${bucket}' exists..."

  # Use docker to run mc commands
  docker run --rm --network host \
    -e MC_HOST_minio="http://${MINIO_ROOT_USER:-minioadmin}:${MINIO_ROOT_PASSWORD:-minioadmin}@localhost:9000" \
    minio/mc mb --ignore-existing "minio/${bucket}" 2>/dev/null || true

  log_info "Bucket '${bucket}' is ready"
}

# Build the application
build_app() {
  log_info "Building application..."
  bun run bun:build
}

# Upload assets to MinIO
upload_assets() {
  log_info "Uploading assets to MinIO..."
  bun run --env-file=.env scripts/upload-to-minio.ts
}

# Start the backend
start_backend() {
  log_info "Starting backend server with STORAGE_PROVIDER=minio..."
  STORAGE_PROVIDER=minio exec bun run --env-file=.env backend.ts
}

# Main
main() {
  log_info "Starting Docker + MinIO integration..."

  check_requirements
  load_env
  start_minio
  create_bucket
  build_app
  upload_assets
  start_backend
}

main "$@"
