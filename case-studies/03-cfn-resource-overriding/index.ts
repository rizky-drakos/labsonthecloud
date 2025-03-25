import { Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ResourceOverriding extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        // If a random string is generated for every deployment, the bucket will be
        // re-created everytime -> use a fixed string from cdk.context.json
        new Bucket(this, `my-bucket-${this.node.tryGetContext('random_string')}`);
    }
}