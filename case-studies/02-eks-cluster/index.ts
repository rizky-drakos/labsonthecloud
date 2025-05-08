import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Addon, Cluster, HelmChart, KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import { KubectlV32Layer } from '@aws-cdk/lambda-layer-kubectl-v32';
import { CfnLaunchTemplate, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Policy, PolicyDocument, Role } from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';
import { join } from 'path';

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

    // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html#imds-considerations
    const defaultLunchTemplate = new CfnLaunchTemplate(this, 'LaunchTemplate', {
        launchTemplateData: {
            metadataOptions: {
                httpPutResponseHopLimit: 2,
            },
        },
    });

    const defaultNodeGroup = cluster.addNodegroupCapacity('default-node-group', {
        desiredSize: 2,
        maxSize: 3,
        minSize: 1,
        instanceTypes: [ new InstanceType('t2.small') ],
        amiType: NodegroupAmiType.AL2023_X86_64_STANDARD,
        launchTemplateSpec: {
            id: defaultLunchTemplate.ref
        }
    });
    defaultNodeGroup.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    defaultNodeGroup.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEFSCSIDriverPolicy'));
    defaultNodeGroup.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEBSCSIDriverPolicy'));
    defaultNodeGroup.role.attachInlinePolicy(
        new Policy(this, 'EKSNodeGroupPolicy', {
            document: PolicyDocument.fromJson(
                JSON.parse(readFileSync(join(__dirname, 'LoadBalancerControllerPolicy.json'), 'utf8'))
            )
        })
    );

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

    const albController = new HelmChart(this, 'aws-load-balancer-controller', {
        cluster: cluster,
        chart: 'aws-load-balancer-controller',
        repository: 'https://aws.github.io/eks-charts',
        release: 'aws-load-balancer-controller',
        namespace: 'kube-system',
        values: {
            clusterName: cluster.clusterName,
        },
        wait: true,
        timeout: Duration.seconds(600),
    });

    const ingressNginx = new HelmChart(this, 'ingress-nginx', {
        cluster: cluster,
        chart: 'ingress-nginx',
        repository: 'https://kubernetes.github.io/ingress-nginx',
        release: 'ingress-nginx',
        namespace: 'kube-system',
        values: {
            controller: {
                service: {
                    type: 'LoadBalancer',
                    annotations: {
                        'service.beta.kubernetes.io/aws-load-balancer-name': 'experimental-cluster',
                        'service.beta.kubernetes.io/aws-load-balancer-type': 'external',
                        'service.beta.kubernetes.io/aws-load-balancer-nlb-target-type': 'ip',
                        'service.beta.kubernetes.io/aws-load-balancer-scheme': 'internet-facing',

                    },
                },
            },
        },
        wait: true,
        timeout: Duration.seconds(600),
    });
    ingressNginx.node.addDependency(albController);

    const certManager = new HelmChart(this, 'cert-manager', {
        cluster: cluster,
        chart: 'cert-manager',
        repository: 'https://charts.jetstack.io',
        release: 'cert-manager',
        namespace: 'cert-manager',
        createNamespace: true,
        values: {
            installCRDs: true,
        },
        wait: true,
        timeout: Duration.seconds(600),
    });
    certManager.node.addDependency(ingressNginx);

    new CfnOutput(this, 'ClusterName', {
        value: cluster.openIdConnectProvider.openIdConnectProviderIssuer
    });
  }
}