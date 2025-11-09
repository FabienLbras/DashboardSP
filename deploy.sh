#!/usr/bin/env bash
set -euo pipefail

# Simple deploy helper for the Success Payment Dashboard
# - Builds the Docker image
# - Runs the container exposing port 3000 by default
#
# You can override defaults via environment variables:
#   IMAGE_NAME (default: success-payment-dashboard)
#   CONTAINER_NAME (default: spd)
#   HOST_PORT (default: 3000)
#
# Usage:
#   ./deploy.sh build            # Build the Docker image
#   ./deploy.sh run              # Run container (detached)
#   ./deploy.sh deploy           # Build and (re)run container
#   ./deploy.sh stop             # Stop and remove container
#   ./deploy.sh logs             # Tail container logs
#   ./deploy.sh status           # Show container status
#   ./deploy.sh rmimage          # Remove the built image
#   ./deploy.sh help             # Show this help

IMAGE_NAME=${IMAGE_NAME:-success-payment-dashboard}
CONTAINER_NAME=${CONTAINER_NAME:-spd}
HOST_PORT=${HOST_PORT:-3000}
CONTAINER_PORT=3000

info() { echo "[INFO] $*"; }
err()  { echo "[ERROR] $*" >&2; }

build() {
  info "Building image: ${IMAGE_NAME}"
  docker build -t "${IMAGE_NAME}" .
}

run() {
  info "Starting container: ${CONTAINER_NAME} -> http://localhost:${HOST_PORT}"
  # Remove existing container if exists
  if docker ps -a --format '{{.Names}}' | grep -qw "${CONTAINER_NAME}"; then
    info "Container exists, removing..."
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  fi
  docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    -p "${HOST_PORT}:${CONTAINER_PORT}" \
    "${IMAGE_NAME}"
}

deploy() {
  build
  run
  info "Deployed. Open: http://localhost:${HOST_PORT}"
}

stop() {
  info "Stopping container: ${CONTAINER_NAME}"
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  docker rm "${CONTAINER_NAME}"   >/dev/null 2>&1 || true
  info "Stopped and removed container if it existed."
}

logs() {
  docker logs -f "${CONTAINER_NAME}"
}

status() {
  docker ps -a --filter "name=${CONTAINER_NAME}" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
}

rmimage() {
  info "Removing image: ${IMAGE_NAME}"
  docker rmi "${IMAGE_NAME}"
}

help() {
  grep '^#' "$0" | cut -c4-
}

CMD=${1:-help}
case "$CMD" in
  build) build ;;
  run) run ;;
  deploy) deploy ;;
  stop) stop ;;
  logs) logs ;;
  status) status ;;
  rmimage) rmimage ;;
  help|--help|-h) help ;;
  *) err "Unknown command: $CMD"; echo; help; exit 1 ;;
 esac
