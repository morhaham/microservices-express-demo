#!/bin/bash

# Exit on error
set -e

echo "🧹 Cleaning up existing resources..."

# Delete deployment if exists
echo "Removing deployment..."
kubectl delete deployment kafka -n kafka-dev --ignore-not-found

# Delete any existing pods
echo "Removing pods..."
kubectl delete pod -l app=kafka -n kafka-dev --ignore-not-found

# Wait for resources to be fully deleted
echo "Waiting for cleanup to complete..."
sleep 5

echo "🚀 Setting up local Kubernetes development environment..."

# Check if minikube is running
if ! minikube status >/dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start
fi

# Create kafka-dev namespace if it doesn't exist
if ! kubectl get namespace kafka-dev >/dev/null 2>&1; then
    echo "Creating kafka-dev namespace..."
    kubectl create namespace kafka-dev
fi

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
kubectl apply -f k8s/kafka-deployment-dev.yaml

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=kafka -n kafka-dev --timeout=120s

echo "Kafka setup complete!"