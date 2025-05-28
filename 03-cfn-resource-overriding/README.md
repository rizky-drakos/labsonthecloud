# CloudFront API Caching with AWS CDK

This project demonstrates that Cloudformation does not override drifted resources when they were updated manually (as opposed to Terraform).

## Steps To Reproduce

- Deploy the stack.
- Update/delete the deploy S3 bucket.
- Run Drift detection for the stack and examine the results (*the stack should be now drifted*).
- Deploy the same stack again, and verify if the drifted S3 bucket is recovered (*it is expected that the deployment does not recover the drifted stack*).

## Conclusion

- Re-applying/deploying the same stack configurations **does not recover drifted resources**.
- Drifted resources **can only** be detected when running drift detection explicitly.
