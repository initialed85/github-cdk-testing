import * as cdk from "aws-cdk-lib";
import * as construct from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as resourcegroups from "aws-cdk-lib/aws-resourcegroups";
import * as s3 from "aws-cdk-lib/aws-s3";

const RESOURCE_GROUP_ID: string = "resourceGroup";

const VPC_ID: string = "vpc";
const VPC_MAX_AXS: number = 2; // need minimum 2 for the ALB
const VPC_NAT_GATEWAYS: number = 0; // because they're costly

const ARTIFACT_BUCKET_ID: string = "artifactBucket";

export class DependenciesStack extends cdk.Stack {
  public artifactBucket: s3.Bucket;

  constructor(
    scope: construct.Construct,
    id: string,
    gitDescribe: string,
    gitCommitHash: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const gitDescribeTag = new cdk.Tag("GIT_DESCRIBE", gitDescribe);
    gitDescribeTag.visit(this);

    const gitCommitHashTag = new cdk.Tag("GIT_COMMIT_HASH", gitCommitHash);
    gitCommitHashTag.visit(this);

    const resourceGroup = new resourcegroups.CfnGroup(this, RESOURCE_GROUP_ID, {
      name: this.stackName,
      resourceQuery: {
        type: "CLOUDFORMATION_STACK_1_0",
      },
      tags: [gitDescribeTag, gitCommitHashTag],
    });

    const vpc = new ec2.Vpc(this, VPC_ID, {
      maxAzs: VPC_MAX_AXS,
      natGateways: VPC_NAT_GATEWAYS,
    });
    resourceGroup.resources?.push(vpc.vpcArn);

    const artifactBucket = new s3.Bucket(this, ARTIFACT_BUCKET_ID, {
      enforceSSL: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      objectLockEnabled: false,
      eventBridgeEnabled: false,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
    });
    resourceGroup.resources?.push(artifactBucket.bucketArn);
    new cdk.CfnOutput(this, "artifactBucket.bucketDomainName", {
      value: artifactBucket.bucketDomainName,
    });
    new cdk.CfnOutput(this, "artifactBucket.bucketName", {
      value: artifactBucket.bucketName,
    });

    this.artifactBucket = artifactBucket;
  }
}
