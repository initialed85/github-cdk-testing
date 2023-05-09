import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

const USER_ID = "User";
const ARTIFACT_BUCKET_ID = "ArtifactBucket";
const ARTIFACT_PATH = "$CODEBUILD_WEBHOOK_TRIGGER";
const BACKEND_PROJECT_ID = "BackendProject";
const BACKEND_PUBLIC_ECR_IMAGE = "public.ecr.aws/docker/library/golang";
const BACKEND_PUBLIC_ECR_TAG = "1.19-bullseye";
const FRONTEND_PROJECT_ID = "FrontendProject";
const FRONTEND_PUBLIC_ECR_IMAGE = "public.ecr.aws/docker/library/node";
const FRONTEND_PUBLIC_ECR_TAG = "18.16.0-bullseye";
const APP_BUILD_STACK_ID = "AppBuildStack";

export interface AppBuildStackProps extends cdk.StackProps {
  readonly githubTokenSecretName: string;
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
}

export class AppBuildStack extends cdk.Stack {
  constructor(
    scope: constructs.Construct,
    id: string,
    props: AppBuildStackProps
  ) {
    super(scope, id, props);

    const gitHubSource = codebuild.Source.gitHub({
      owner: props.githubOwner,
      repo: props.githubRepo,
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(
          props.githubBranch
        ),
      ],
    });

    const user = new iam.User(this, USER_ID);
    ecr.AuthorizationToken.grantRead(user);
    ecr.PublicGalleryAuthorizationToken.grantRead(user);

    const artifactBucket = new s3.Bucket(this, ARTIFACT_BUCKET_ID, {
      enforceSSL: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      objectLockEnabled: false,
      eventBridgeEnabled: false,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
    });

    const backendProject = new codebuild.Project(this, BACKEND_PROJECT_ID, {
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromDockerRegistry(
          `${BACKEND_PUBLIC_ECR_IMAGE}:${BACKEND_PUBLIC_ECR_TAG}`
        ),
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        env: {
          variables: {
            GOOS: "linux",
            GOARCH: "amd64",
            CGO_ENABLED: 0,
          },
        },
        phases: {
          install: {
            commands: ["apt-get update && apt-get install -y zip"],
          },
          pre_build: {
            commands: ["cd ./backend", "go mod download"],
          },
          build: {
            commands: [
              "go build -x -o bin/root_handler cmd/root_handler/main.go",
            ],
          },
          post_build: {
            commands: [
              "cd ./bin",
              "zip -r backend__root_handler.zip .",
              `mkdir -p /${ARTIFACT_PATH}`,
              `mv backend__root_handler.zip /${ARTIFACT_PATH}/backend__root_handler.zip`,
            ],
          },
        },
        artifacts: {
          files: [`/${ARTIFACT_PATH}/backend__root_handler.zip`],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactBucket,
        name: `/${ARTIFACT_PATH}/frontend__build.zip`,
        includeBuildId: false,
        packageZip: false,
      }),
    });
    artifactBucket.grantReadWrite(backendProject);

    const frontendProject = new codebuild.Project(this, FRONTEND_PROJECT_ID, {
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromDockerRegistry(
          `${FRONTEND_PUBLIC_ECR_IMAGE}:${FRONTEND_PUBLIC_ECR_TAG}`
        ),
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        env: {
          variables: {},
        },
        phases: {
          install: {
            commands: ["apt-get update && apt-get install -y zip"],
          },
          pre_build: {
            commands: ["cd ./frontend", "npm ci"],
          },
          build: {
            commands: ["npm run build"],
          },
          post_build: {
            commands: [
              "cd ./build",
              "zip -r frontend__build.zip .",
              `mkdir -p /${ARTIFACT_PATH}`,
              `mv frontend__build.zip /${ARTIFACT_PATH}/frontend__build.zip`,
            ],
          },
        },
        artifacts: {
          files: [`/${ARTIFACT_PATH}/frontend__build.zip`],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactBucket,
        name: `/${ARTIFACT_PATH}/frontend__build.zip`,
        includeBuildId: false,
        packageZip: false,
      }),
    });
    artifactBucket.grantReadWrite(backendProject);
  }
}

export class AppBuildStage extends cdk.Stage {
  public readonly appBuildStack: AppBuildStack;

  constructor(
    scope: constructs.Construct,
    id: string,
    props: AppBuildStackProps
  ) {
    super(scope, id, props);

    this.appBuildStack = new AppBuildStack(this, APP_BUILD_STACK_ID, props);
  }
}
