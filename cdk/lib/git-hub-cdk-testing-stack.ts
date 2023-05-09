import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as constructs from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as elbv2_targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as resourcegroups from "aws-cdk-lib/aws-resourcegroups";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

const INDEX_HTML: string = "index.html";
const ERROR_HTML: string = "error.html";
const API_PATH_PATTERN: string = "/api/*";
const HTTP_PORT: number = 80;

const RESOURCE_GROUP_ID: string = "resourceGroup";

const VPC_ID: string = "vpc";
const VPC_MAX_AXS: number = 2; // need minimum 2 for the ALB
const VPC_NAT_GATEWAYS: number = 0; // because they're costly

const USER_ID: string = "user";

const ARTIFACT_BUCKET_ID: string = "artifactBucket";

const CONTENT_BUCKET_ID: string = "contentBucket";
const CONTENT_BUCKET_ORIGIN_ACCESS_IDENTITY_ID: string =
  "contentBucketOriginAccessIdentity";

const CONTENT_BUCKET_DEPLOYMENT_ID: string = "contentBucketDeployment";
const CONTENT_BUCKET_DEPLOYMENT_LOCAL_PATH: string = "../frontend/build";
const CONTENT_BUCKET_DEPLOYMENT_REMOTE_PATH: string = "frontend";

const ROOT_LAMBDA_ID: string = "rootLambda";
const ROOT_LAMBDA_HANDLER: string = "root_handler";
const ROOT_LAMBDA_LOCAL_PATH: string = "../backend/bin";

const ALB_ID: string = "alb";
const ALB_HTTP_LISTENER_ID: string = "albHttpListener";
const ALB_HTTP_TARGET_ID: string = "albHttpTarget";

const CDN_DISTRIBUTION_ID: string = "cdnDistribution";

export interface GitHubCdkTestingStackProps extends cdk.StackProps {}

export class GitHubCdkTestingStack extends cdk.Stack {
  constructor(
    scope: constructs.Construct,
    id: string,
    environment: string,
    gitDescribe: string,
    gitCommitHash: string,
    props?: GitHubCdkTestingStackProps
  ) {
    super(scope, id, props);

    const environmentTag = new cdk.Tag("ENVIRONMENT", environment);
    environmentTag.visit(this);

    const gitDescribeTag = new cdk.Tag("GIT_DESCRIBE", gitDescribe);
    gitDescribeTag.visit(this);

    const gitCommitHashTag = new cdk.Tag("GIT_COMMIT_HASH", gitCommitHash);
    gitCommitHashTag.visit(this);

    const resourceGroup = new resourcegroups.CfnGroup(this, RESOURCE_GROUP_ID, {
      name: this.stackName,
      resourceQuery: {
        type: "CLOUDFORMATION_STACK_1_0",
      },
      tags: [environmentTag, gitDescribeTag, gitCommitHashTag],
    });

    const user = new iam.User(this, USER_ID);
    resourceGroup.resources?.push(user.userArn);

    const vpc = new ec2.Vpc(this, VPC_ID, {
      maxAzs: VPC_MAX_AXS,
      natGateways: VPC_NAT_GATEWAYS,
    });
    resourceGroup.resources?.push(vpc.vpcArn);

    const contentBucket = new s3.Bucket(this, CONTENT_BUCKET_ID, {
      enforceSSL: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      objectLockEnabled: false,
      eventBridgeEnabled: false,
      websiteIndexDocument: INDEX_HTML,
      websiteErrorDocument: ERROR_HTML,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
    });
    resourceGroup.resources?.push(contentBucket.bucketArn);
    new cdk.CfnOutput(this, "contentBucket.bucketDomainName", {
      value: contentBucket.bucketDomainName,
    });
    new cdk.CfnOutput(this, "contentBucket.bucketName", {
      value: contentBucket.bucketName,
    });

    const contentBucketOriginAccessIdentity =
      new cloudfront.OriginAccessIdentity(
        this,
        CONTENT_BUCKET_ORIGIN_ACCESS_IDENTITY_ID
      );
    contentBucket.grantPublicAccess(CONTENT_BUCKET_DEPLOYMENT_REMOTE_PATH);
    contentBucket.grantRead(contentBucketOriginAccessIdentity);

    new s3deploy.BucketDeployment(this, CONTENT_BUCKET_DEPLOYMENT_ID, {
      sources: [
        s3deploy.Source.bucket(
          contentBucket, // TODO: incorrect; just making code compile
          `${gitDescribe}/frontend/build.zip`
        ),
      ],
      destinationBucket: contentBucket,
      destinationKeyPrefix: CONTENT_BUCKET_DEPLOYMENT_REMOTE_PATH,
    });

    const rootLambda = new lambda.Function(this, ROOT_LAMBDA_ID, {
      runtime: lambda.Runtime.GO_1_X,
      handler: ROOT_LAMBDA_HANDLER,
      code: lambda.Code.fromBucket(
        contentBucket, // TODO: incorrect; just making code compile
        `${gitDescribe}/backend/bin.zip`
      ),
      vpc: vpc,
    });
    resourceGroup.resources?.push(rootLambda.functionArn);

    const alb = new elbv2.ApplicationLoadBalancer(this, ALB_ID, {
      vpc: vpc,
      internetFacing: true,
    });
    resourceGroup.resources?.push(alb.loadBalancerArn);
    new cdk.CfnOutput(this, "alb.loadBalancerDnsName", {
      value: alb.loadBalancerDnsName,
    });

    const albHttpListener = alb.addListener(ALB_HTTP_LISTENER_ID, {
      port: HTTP_PORT,
      open: true,
    });
    resourceGroup.resources?.push(albHttpListener.listenerArn);

    albHttpListener.addTargets(ALB_HTTP_TARGET_ID, {
      targets: [new elbv2_targets.LambdaTarget(rootLambda)],
    });

    const cdnDistribution = new cloudfront.Distribution(
      this,
      CDN_DISTRIBUTION_ID,
      {
        defaultBehavior: {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          origin: new origins.S3Origin(contentBucket, {
            originPath: `/${CONTENT_BUCKET_DEPLOYMENT_REMOTE_PATH}`,
            originAccessIdentity: contentBucketOriginAccessIdentity,
          }),
        },
        additionalBehaviors: {
          [API_PATH_PATTERN]: {
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            compress: true,
            origin: new origins.LoadBalancerV2Origin(alb, {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
              httpPort: HTTP_PORT,
            }),
          },
        },
        enabled: true,
      }
    );
    resourceGroup.resources?.push(albHttpListener.listenerArn);
    new cdk.CfnOutput(this, "cdnDistribution.distributionDomainName", {
      value: cdnDistribution.distributionDomainName,
    });
  }
}
