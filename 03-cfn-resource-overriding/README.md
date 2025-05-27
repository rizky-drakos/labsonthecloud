# CloudFront API Caching with AWS CDK

This project demonstrates that Cloudformation does not override drifted resources when they were updated manually (as opposed to Terraform).

## Conclusion

- Re-applying/deploying the same stack configurations does not recover drifted resources.
- Drifted resources **can only** be detected when running drift detection explicitly.

## Steps To Reproduce

- Deploy the stack.
- Update/delete the deploy S3 bucket.
- Run Drift detection for the stack and examine the results.
- Deploy the same stack configurations again and verify if the drifted S3 bucket is recovered.
