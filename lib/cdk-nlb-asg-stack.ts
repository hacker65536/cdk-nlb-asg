import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import { CfnOutput } from '@aws-cdk/core';

export class CdkNlbAsgStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // myip
    const myip = '192.168.0.1/32'; //example

    // vpc
    const vpc = new ec2.Vpc(this, 'vcp', {
      maxAzs: 2,
      natGateways: 1,
    });

    // nlb
    const nlb = new elbv2.NetworkLoadBalancer(this, 'nlb', {
      vpc,
      internetFacing: true,
    });

    // userdata
    const userdatacmd = ['yum install -y httpd', 'systemctl start httpd'];
    const userdata = ec2.UserData.forLinux({
      shebang: '#!/usr/bin/env bash',
    });

    userdata.addCommands(...userdatacmd);

    // asg
    const asg = new autoscaling.AutoScalingGroup(this, 'asg', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      desiredCapacity: 2,
      updateType: autoscaling.UpdateType.REPLACING_UPDATE,
      userData: userdata,
    });

    // iam managed policy for asg role
    const policies: string[] = [
      'AmazonSSMManagedInstanceCore',
      //"service-role/AmazonEC2RoleforSSM"
    ];

    for (let v of policies) {
      asg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(v));
    }

    // nlb listener
    const nlistener = new elbv2.NetworkListener(this, 'nlistner', {
      loadBalancer: nlb,
      port: 80,
    });
    nlistener.addTargets('app', {
      port: 80,
      targets: [asg],
    });

    // allow connection in vpc cidr
    const cidrsec = new ec2.SecurityGroup(this, 'cidrsec', {
      vpc,
    });

    // add ingressrule to additional security group
    cidrsec.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.allTraffic());
    cidrsec.addIngressRule(ec2.Peer.ipv4(myip), ec2.Port.allTraffic());

    // add sg to asg
    asg.addSecurityGroup(cidrsec);
    asg.connections.allowInternally(ec2.Port.allTraffic());

    new CfnOutput(this, 'nlbdns', {
      value: 'http://' + nlb.loadBalancerDnsName,
    });
  }
}
