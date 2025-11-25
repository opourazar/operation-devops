# A misconfigured main terraform file that needs to be fixed

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Wrong region
}

resource "aws_instance" "web" {
  ami           = "ami-12345"
  instance_type = "t2.large" # Too expensive
  tags = {
    Name = "demo-web-server"
  }
}

output "instance_ip" {
  value = aws_instance.web.public_ip
}
