
# Add autoscaling here. Follow the TODOs or click "Show autoscaling structure" in the editor to peek at a solved example.
#
# TODO 1 — Launch template:
#   - Resource name: aws_launch_template.demo_template
#   - name_prefix: "demo-template-"
#   - image_id: "ami-12345"
#   - instance_type: var.instance_type
#
# TODO 2 — Auto Scaling Group:
#   - Resource name: aws_autoscaling_group.demo_asg
#   - desired_capacity: 1, min_size: 1, max_size: 3
#   - Include launch_template { id = aws_launch_template.demo_template.id, version = "$Latest" }
#
# TODO 3 — Tag for readability:
#   Inside the ASG, add:
#   key   = "Name"
#   value = "demo-autoscaling"
#   propagate_at_launch = true
#
# Start your resources below. Keep the TODOs for quick reminders while you type.
