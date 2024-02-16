terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.33.0"
    }
  }
}

provider "aws" {
  # Default creds/configs.
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "description"
    values = ["Canonical, Ubuntu, 22.04 LTS, amd64 jammy image build on 2023-12-07"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "k8s-nodes" {
  for_each                = toset(["master", "worker"])
  ami                     = data.aws_ami.ubuntu.id
  instance_type           = "t2.medium"
  key_name                = "ap-south-1"
  vpc_security_group_ids  = [ "sg-f3bda690" ]
  user_data               = "${file("../../utilities/k8s-init.sh")}"
  tags                    = {
    Name = each.key
  }

  lifecycle {
    ignore_changes = [
      user_data
    ] 
  }
}

output "public_ips" {
  value = { for node in aws_instance.k8s-nodes: node.tags_all["Name"] => node.public_ip }
}
