import { Stack, StackProps, App, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class CachingExperients extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cachingFunction = new NodejsFunction(this, 'caching-function', {
        runtime: Runtime.NODEJS_20_X,
        entry: join(__dirname, 'lambda', 'index.ts'),
        handler: 'handler',
    });

    const api = new LambdaRestApi(this, 'caching-api', {
        handler: cachingFunction,
        cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
        proxy: false,
        deployOptions: {
            stageName: 'v1',
        }
    });

    api.root.addMethod('GET');

    const apiOrigin = new RestApiOrigin(api, {
        originPath: '/',
    });
    new Distribution(this, 'MyDistribution', {
        defaultBehavior: {
            origin: apiOrigin
        },
        additionalBehaviors: {
            '/v1/*': { origin: apiOrigin }
        }
    });
  }
}