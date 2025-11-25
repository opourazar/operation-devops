# Outputs for visibility after deployment (no changes needed here)


output "web_instance_ip" {
  description = "Public IP address of the deployed web instance"
  value       = aws_instance.web.public_ip
}

output "aws_region" {
  description = "The region where the instance was created"
  value       = var.aws_region
}
