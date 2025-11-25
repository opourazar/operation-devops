
# We will add an auto scaling group in this file

# 🧩 TODO 1:
# Define a launch template for your EC2 instances.
#   - Name prefix: "demo-template-"
#   - Use an existing image_id (e.g., ami-12345)
#   - Use var.instance_type as instance type
# Hint: resource "aws_launch_template" "demo_template" { ... }

# 🧩 TODO 2:
# Define an Auto Scaling Group that references your launch template.
#   - desired_capacity: 1
#   - min_size: 1
#   - max_size: 3
#   - Inside it, add a `launch_template` block referencing your template.
# Hint: resource "aws_autoscaling_group" "demo_asg" { ... }

# 🧩 TODO 3:
# Add a tag block inside the Auto Scaling Group:
#   key   = "Name"
#   value = "demo-autoscaling"
#   propagate_at_launch = true

