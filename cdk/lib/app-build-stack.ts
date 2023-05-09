import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";

const USER_ID: string = "User";
const BACKEND_PROJECT_ID = "BackendProject";
const BACKEND_PUBLIC_ECR_IMAGE = "public.ecr.aws/docker/library/golang";
const BACKEND_PUBLIC_ECR_TAG = "1.19-bullseye";
const BACKEND_ECR_ID = "BackendECR";

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
          props.githubBranch // TODO
        ),
      ],
    });

    const user = new iam.User(this, USER_ID);
    ecr.AuthorizationToken.grantRead(user);
    ecr.PublicGalleryAuthorizationToken.grantRead(user);

    const backendEcr = ecr.Repository.fromRepositoryName(
      this,
      BACKEND_ECR_ID,
      BACKEND_PUBLIC_ECR_IMAGE
    );

    const backendProject = new codebuild.Project(this, BACKEND_PROJECT_ID, {
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(
          backendEcr,
          BACKEND_PUBLIC_ECR_TAG
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
            commands: ["cd ./backend && go mod download"],
          },
          build: {
            commands: [
              "cd ./backend && go build -x -o bin/root_handler cmd/root_handler/main.go",
            ],
          },
        },
      }),
    });
  }
}
