#!/bin/bash
sudo apt-get update

sudo apt-get install -y postgresql postgresql-contrib

sudo apt install docker.io -y

sudo usermod -aG docker vagrant

sudo apt install docker-compose -y

# Optionally: Install Kompose for Docker Compose to Kubernetes conversion
curl -L https://github.com/kubernetes/kompose/releases/download/v1.26.0/kompose-linux-amd64 -o kompose
sudo chmod +x kompose
sudo mv kompose /usr/local/bin/

# Install minikube
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x minikube
sudo mv minikube /usr/local/bin/


# Install Helm
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

# Install Prometheus and Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/prometheus
# Install Grafana
helm install grafana grafana/grafana

# Add the Argo CD Helm Repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd

# add namespace
kubectl create namespace milestone-2-op

# Check installations
kubectl version --client
helm version
minikube version