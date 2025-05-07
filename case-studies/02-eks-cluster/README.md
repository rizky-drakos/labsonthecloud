# Helpful commands

```
// Retrieve the addon versions that are compatible with the Kubernetes version of your cluster.
aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.32

// Deploy the echo service.
kubectl create namespace apps
SERVICE_NAME=echo NS=apps envsubst < echo-service.yaml | kubectl apply -f -
```