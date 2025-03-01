# CloudFront API Caching with AWS CDK

This project demonstrates how to use AWS CloudFront to cache responses from an API Gateway. The setup is created using AWS CDK and includes a Lambda function that serves as the backend for the API Gateway.

## Features

- **CloudFront Caching**: CloudFront can cache responses from API Gateway, reducing the load on the backend and improving response times for end-users.
- **Cache Duration Control**: The cache duration can be controlled via either the behavior of the CloudFront distribution or the `Cache-Control` header in the response from the API Gateway.
- **Cache-Control Header**: When the `Cache-Control` header is set in the API Gateway response and its value is lower than the `maxTTL` of the CloudFront distribution, the `Cache-Control` value is applied.

## Usage

After deploying the stack, you will have an API Gateway endpoint that is cached by CloudFront. You can control the cache duration by setting the `Cache-Control` header in the Lambda function response.

## References

[Specify the amount of time that CloudFront caches objects](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html#ExpirationDownloadDist)


