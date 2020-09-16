#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkNlbAsgStack } from '../lib/cdk-nlb-asg-stack';

const app = new cdk.App();
new CdkNlbAsgStack(app, 'CdkNlbAsgStack');
