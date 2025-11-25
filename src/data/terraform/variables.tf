# Variable Definitions (no changes needed here)


variable "aws_region" {
  description = "AWS region where resources are deployed"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Instance type to be used for EC2"
  type        = string
  default     = "t2.large"
}
