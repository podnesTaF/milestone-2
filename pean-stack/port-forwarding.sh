#!/bin/bash

# Forward ports for backend services
kubectl port-forward pod/frontend-op-7758bc6b48-fz6tn --address 192.168.56.5 30080:80 &
kubectl port-forward svc/backend-op --address 192.168.56.5 3000:3000 &

kubectl port-forward service/argocd-server --address 192.168.56.5 8080:443 &
# kubectl port-forward deploy/grafana --address 192.168.56.5 3000:3000 &
kubectl port-forward deploy/prometheus-server --address 192.168.56.5 9090:9090 &
# Add any other services as needed

# Wait for any process to exit
wait