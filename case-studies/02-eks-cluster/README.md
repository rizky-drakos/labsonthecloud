# Helpful Commands

Retrieve the addon versions that are compatible with the Kubernetes version of your cluster.

```
aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.32
```

Deploy/decommision Kubernetes resources with Kustomization.
```
kustomize build --enable-alpha-plugins --enable-exec . | kubectl [apply | delete] -f -
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

To edit the secrets, .sops.yaml is used as the SOPS default config file:

```
cd enc
sops secrets-letsencrypt.enc.yaml
```

Then reference the secret files in the ksops generators.

```
apiVersion: viaduct.ai/v1
kind: ksops
metadata:
  name: secrets-generator
files:
  - ./secrets-letsencrypt.enc.yaml
```

For ArgoCD to decryp the secrets, the private key has to be imported to its container [2].

# References
- [1] https://blog.oddbit.com/post/2021-03-09-getting-started-with-ksops/
- [2] https://blog.devgenius.io/argocd-with-kustomize-and-ksops-2d43472e9d3b
- [3] Re-used templates:
  - [LoadBalancerControllerPolicy](https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/refs/heads/main/docs/install/iam_policy.json)
  - [KarpenterResources](https://raw.githubusercontent.com/aws/karpenter-provider-aws/refs/heads/main/website/content/en/v1.4/getting-started/getting-started-with-karpenter/cloudformation.yaml)