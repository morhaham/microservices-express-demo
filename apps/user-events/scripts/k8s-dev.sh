#!/bin/bash

# Exit on error
set -e

echo "User Events Setup k8s"
echo "🧹 Cleaning up existing resources..."

# Check if minikube is running
if ! minikube status >/dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start
fi

# Delete deployment if exists
echo "Removing deployment..."
kubectl delete deployment user-events -n user-events-dev --ignore-not-found

# Delete any existing pods
echo "Removing pods..."
kubectl delete pod -l app=user-events -n user-events-dev --ignore-not-found

# Wait for resources to be fully deleted
echo "Waiting for cleanup to complete..."
sleep 3

echo "🚀 Setting up local Kubernetes dev environment..."

# Create dev namespace if it doesn't exist
if ! kubectl get namespace user-events-dev >/dev/null 2>&1; then
    echo "Creating user-events-dev namespace..."
    kubectl create namespace user-events-dev
fi

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
kubectl apply -f k8s/user-events-deployment-dev.yaml
kubectl apply -f k8s/user-events-ingress-dev.yaml

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=user-events -n user-events-dev --timeout=20s

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
echo "kubectl get pods -n user-events-dev"
echo "kubectl get ingress -n user-events-dev" 