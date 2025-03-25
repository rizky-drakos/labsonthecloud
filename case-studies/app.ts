import { App } from 'aws-cdk-lib';
import { CachingExperients } from './01-cloudfront-api-caching';
import { ResourceOverriding } from './03-cfn-resource-overriding';

const app = new App();
new CachingExperients(app, 'CloudFrontAPICaching');
new ResourceOverriding(app, 'ResourceOverriding');
