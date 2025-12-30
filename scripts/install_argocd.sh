#!/bin/bash
set -e

echo "Installing ArgoCD..."
kubectl create namespace argocd || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD server to be ready..."
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

echo "Applying Microservices Application..."
kubectl apply -f k8s/argocd/application.yaml

echo "ArgoCD installed! Password for 'admin':"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""
echo "Access UI by port-forwarding: kubectl port-forward svc/argocd-server -n argocd 8080:443"
