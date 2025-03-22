import { App } from 'aws-cdk-lib';
import { CachingExperients } from './01-cloudfront-api-caching/index';

const app = new App();
new CachingExperients(app, 'CloudFrontAPICaching');
