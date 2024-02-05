#!/bin/bash 

# Update your system
sudo apt update
sudo apt upgrade -y

# Configure persistent loading of modules
sudo tee /etc/modules-load.d/k8s.conf <<EOF
overlay
br_netfilter
EOF

# Ensure you load modules
sudo modprobe overlay
sudo modprobe br_netfilter

# Set up required sysctl params
sudo tee /etc/sysctl.d/kubernetes.conf<<EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

# Reload sysctl
sudo sysctl --system

OS="xUbuntu_22.04"
VERSION=1.28

echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
echo "deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$VERSION/$OS/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable:cri-o:$VERSION.list

curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$VERSION/$OS/Release.key | sudo apt-key add -
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/Release.key | sudo apt-key add -

sudo apt-get update
sudo apt-get install cri-o cri-o-runc -y

# Start and enable Service
sudo systemctl daemon-reload
sudo systemctl restart crio
sudo systemctl enable crio

# Install k8s
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL "https://pkgs.k8s.io/core:/stable:/v${VERSION}/deb/Release.key" | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v${VERSION}/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt install wget curl vim git kubelet kubeadm kubectl -y
sudo apt-mark hold kubelet kubeadm kubectl

# Execute these on the master node.
# sudo kubeadm init --pod-network-cidr=192.168.0.0/16

# USER=ubuntu
# mkdir -p /home/$USER/.kube
# sudo cp -i /etc/kubernetes/admin.conf /home/$USER/.kube/config
# sudo chown $USER:$USER /home/$USER/.kube/config

# Allow pods to be scheduled on master node. 
# kubectl taint nodes --all node-role.kubernetes.io/control-plane-

# Install Weaveworks CNI.
# curl -L https://github.com/weaveworks/weave/releases/download/v2.8.1/weave-daemonset-k8s.yaml -o cni.yaml
# Replace pod network CIDR as follows before applying the manifest:
#   containers:
#     - name: weave
#       env:
        # - name: IPALLOC_RANGE
        #   value: 192.168.0.0/16
# Refs: https://www.weave.works/docs/net/latest/kubernetes/kube-addon/#-changing-configuration-options

# NOTES: 
# - When the CNI is not available on the cluster, pods are created and assigned IPs that do not belong to
# the CIDR range specified in kubeadm init.
# - Once the CNI is ready, restart the coredns deployment so that its pods are assigned with proper IPs. 
