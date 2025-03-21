#!/bin/bash

# Exit on error
set -e

echo "🧹 Cleaning up existing resources..."

# Delete ingress if exists
echo "Removing ingress..."
kubectl delete ingress express-api-ingress -n development --ignore-not-found

echo "Removing kafka..."
kubectl delete deployment kafka -n kafka --ignore-not-found

# Delete deployment if exists
echo "Removing deployment..."
kubectl delete deployment express-api -n development --ignore-not-found

# Delete any existing pods
echo "Removing pods..."
kubectl delete pod -l app=express-api -n development --ignore-not-found
kubectl delete pod -l app=kafka -n kafka --ignore-not-found

# Wait for resources to be fully deleted
echo "Waiting for cleanup to complete..."
sleep 5

echo "🚀 Setting up local Kubernetes development environment..."

# Check if minikube is running
if ! minikube status >/dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start
fi

# Enable ingress addon if not already enabled
if ! minikube addons list | grep -q "ingress: enabled"; then
    echo "Enabling ingress addon..."
    minikube addons enable ingress
fi

# Create development namespace if it doesn't exist
if ! kubectl get namespace development >/dev/null 2>&1; then
    echo "Creating development namespace..."
    kubectl create namespace development
fi

# Create kafka namespace if it doesn't exist
if ! kubectl get namespace kafka >/dev/null 2>&1; then
    echo "Creating kafka namespace..."
    kubectl create namespace kafka
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t express-api:latest . --no-cache

# Load the image into minikube
echo "Loading image into minikube..."
minikube image load express-api:latest

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
kubectl apply -f k8s/kafka-deployment.yaml
kubectl apply -f k8s/express-api-deployment.yaml
kubectl apply -f k8s/express-api-ingress.yaml

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=express-api -n development --timeout=120s

echo "Using minikube tunnel to expose the service..."
minikube tunnel

# Get minikube IP
BASE_URL=http://localhost
echo "✅ Setup complete! You can now access your API at $BASE_URL"
echo "Available endpoints:"
echo "  - Health check: $BASE_URL/health"
echo "  - Root: $BASE_URL/"
echo "  - Send message: $BASE_URL/send-message?message=Hello%20Kafka"
echo ""
echo "To check the status of your deployment, run:"
echo "kubectl get pods -n development"
echo "kubectl get ingress -n development" 