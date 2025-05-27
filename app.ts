import { App } from 'aws-cdk-lib';
import { EKSCluster } from './02-eks-cluster';

const app = new App();
new EKSCluster(app, 'ExperimentalCluster', {
    stackName: 'experimental-cluster',
    env: {
        region: 'ap-southeast-1',
    },
});