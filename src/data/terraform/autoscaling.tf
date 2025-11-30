
# Add autoscaling here. The "Show autoscaling structure" toggle shows a different example, which you can use for orientation.
# The launch template describes an instance blueprint; the ASG defines the elasticity; and the tag block allows traceability/cost reporting.

# TODO 1 - Launch template:
#   - Create a launch template for your EC2 nodes (prefix, AMI (Amazon Machine Image) id choice, instance_type from vars).
#   - Pick names you can reference later from the ASG.

# TODO 2 - Auto Scaling Group:
#   - Create an ASG with a small min and a larger max capacity.
#   - Wire it to your launch template (template id and a version string).

# TODO 3 - Tag for readability:
#   - Add a tag block inside the ASG for discoverability (name/value you choose, propagate at launch).

# Add your code below.
