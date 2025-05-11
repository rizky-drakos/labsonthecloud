# Helpful Commands

```
// Retrieve the addon versions that are compatible with the Kubernetes version of your cluster.
aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.32

// Deploy the echo service.
kubectl create namespace apps
SERVICE_NAME=echo NS=apps envsubst < echo-service.yaml | kubectl apply -f -
```

# Secret Encryption

KSOPS enables Kustomize to enc/dec secrets using SOPS. KSOPS needs to be installed as a Kustomize plugins.

```
tar -C ~/.config/kustomize/plugin/viaduct.ai/v1/ksops -xf ksops_<version>_<os>.tar.gz ksops
```

GPG pre-encryption replaces KMS for cost-saving secret protection before GitHub commit. The secret key is kept locally, and the public key for encrypting secrets is added to Git for secure collaboration.

```
// The public key can be imported to GPG:
gpg --import argocd.pgp.asc
```

To edit the secrets:

```
// .sops.yaml is used as the SOPS default config file.
cd enc
sops secrets.enc.yaml
```

# References
- https://blog.oddbit.com/post/2021-03-09-getting-started-with-ksops/
- https://blog.devgenius.io/argocd-with-kustomize-and-ksops-2d43472e9d3b