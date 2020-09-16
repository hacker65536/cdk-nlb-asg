#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkNlbAsgStack } from '../lib/cdk-nlb-asg-stack';

const defenv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();
new CdkNlbAsgStack(app, 'CdkNlbAsgStack', {
  env: defenv,
});
