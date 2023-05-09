import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";

const USER_ID: string = "User";
const BACKEND_PROJECT_ID = "BackendProject";
const BACKEND_PUBLIC_ECR_IMAGE = "public.ecr.aws/docker/library/golang";
const BACKEND_PUBLIC_ECR_TAG = "1.19-bullseye";
const FRONTEND_PROJECT_ID = "BackendProject";
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
            commands: ["cd ./backend"],
          },
          pre_build: {
            commands: ["go mod download"],
          },
          build: {
            commands: [
              "go build -x -o bin/root_handler cmd/root_handler/main.go",
            ],
          },
        },
      }),
    });

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
            commands: ["cd ./frontend"],
          },
          pre_build: {
            commands: ["npm ci"],
          },
          build: {
            commands: ["npm run build"],
          },
        },
      }),
    });
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
