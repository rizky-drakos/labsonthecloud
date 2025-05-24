import { CfnOutput, Stack, StackProps, CfnJson, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Addon, Cluster, KubernetesVersion, ServiceAccount } from 'aws-cdk-lib/aws-eks';
import { KubectlV32Layer } from '@aws-cdk/lambda-layer-kubectl-v32';
import { ManagedPolicy, OpenIdConnectPrincipal, PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';

export class EKSCluster extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id);

    const cluster = new Cluster(this, 'ExperimentalCluster', {
        clusterName: props.stackName,
        version: KubernetesVersion.V1_32,
        kubectlLayer: new KubectlV32Layer(this, 'kubectl'),
        defaultCapacity: 0,
        mastersRole: Role.fromRoleArn(this, 'eks-master-role', 'arn:aws:iam::891376986941:role/AWSReservedSSO_AdministratorAccess_54e9b2906db8ef24'),
    });

    Tags.of(cluster.vpc).add('karpenter.sh/discovery', 'experimental-cluster');

    const karpenterNodeRole = new Role(this, 'KarpenterNodeRole', {
      roleName: `KarpenterNodeRole-${cluster.clusterName}`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPullOnly'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEBSCSIDriverPolicy'),
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEFSCSIDriverPolicy'),
      ],
      inlinePolicies: {
        LoadBalancerControllerPolicy: PolicyDocument.fromJson(
            JSON.parse(readFileSync(join(__dirname, 'LoadBalancerControllerPolicy.json'), 'utf8'))
        )
      }
    });

    const kapenterResources = new CfnInclude(this, 'EksClusterTemplate', {
        templateFile: join(__dirname, 'KarpenterResources.yaml'),
        parameters: {
            ClusterName: cluster.clusterName,
            KarpenterNodeRoleArn: karpenterNodeRole.roleArn,
        },
    });

    const karpenterControllerRole = new Role(this, 'KarpenterControllerRole', {
        assumedBy: new OpenIdConnectPrincipal(
          cluster.openIdConnectProvider,
          {
            StringEquals: new CfnJson(this, 'KarpenterStringEquals', {
              value: {
                [`${cluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: `system:serviceaccount:karpenter:karpenter`,
                [`${cluster.openIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
              },
            }),
          }
        ),
        managedPolicies: [ 
          ManagedPolicy.fromManagedPolicyArn(
            this,
            'KarpenterControllerPolicy', 
            kapenterResources.getResource('KarpenterControllerPolicy').getAtt('PolicyArn').toString()
          ) 
        ],
    });

    cluster.awsAuth.addRoleMapping(
      Role.fromRoleArn(
        this,
        'KarpenterNodeRoleMapping',
        karpenterNodeRole.roleArn,
      ),
      {
        groups: ['system:bootstrappers', 'system:nodes'],
        username: 'system:node:{{EC2PrivateDNSName}}',
      }
    );

    cluster.addFargateProfile('FargateProfile', {
      fargateProfileName: 'karpenter',
      selectors: [
        {
          namespace: 'karpenter',
        },
      ],
    });

    const karpenterNamespace = cluster.addManifest('KarpenterNamespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'karpenter',
      }
    });

    const karpenterControllerServiceAccount = new ServiceAccount(this, 'KarpenterControllerServiceAccount', {
      cluster: cluster,
      name: 'karpenter',
      namespace: 'karpenter',
      annotations: {
        'eks.amazonaws.com/role-arn': `${karpenterControllerRole.roleArn}`
      },
    });
    karpenterControllerServiceAccount.node.addDependency(karpenterNamespace);

    new Addon(this, 'vpc-cni', {
        addonName: 'vpc-cni',
        cluster: cluster,
        addonVersion: 'v1.19.2-eksbuild.1',
    });

    new Addon(this, 'kube-proxy', {
        addonName: 'kube-proxy',
        cluster: cluster,
        addonVersion: 'v1.32.0-eksbuild.2',
    });

    new Addon(this, 'coredns', {
        addonName: 'coredns',
        cluster: cluster,
        addonVersion: 'v1.11.4-eksbuild.2',
    });

    new CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
    });
  }
}
