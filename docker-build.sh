#!/bin/bash

# Exit on error
set -e

echo "Building Docker images..."

docker build . --target user-events --tag user-events:latest --no-cache
docker build . --target user-analytics --tag user-analytics:latest --no-cache

# Check if minikube is running
if ! minikube status >/dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start
fi

echo "Loading images into minikube..."
minikube image load user-events:latest
minikube image load user-analytics:latest

echo "Done loading apps images into minikube"

