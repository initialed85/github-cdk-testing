import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

const INFRA_REPO_PATH_PATTERN = "/?cdk/.*";
const INFRA_PROJECT_ID = "InfraProject";
const INFRA_DEPLOY_STACK_ID = "InfraDeployStack";

export interface InfraDeployStackProps extends cdk.StackProps {
  readonly githubTokenSecretName: string;
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
}

export class InfraDeployStack extends cdk.Stack {
  constructor(
    scope: constructs.Construct,
    id: string,
    props: InfraDeployStackProps
  ) {
    super(scope, id, props);

    const gitHubSource = codebuild.Source.gitHub({
      owner: props.githubOwner,
      repo: props.githubRepo,
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH)
          .andBranchIs(props.githubBranch)
          .andFilePathIs(INFRA_REPO_PATH_PATTERN),
      ],
    });

    const backendProject = new codebuild.Project(this, INFRA_PROJECT_ID, {
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: ["npm install -g aws-cdk@2.78.0"],
          },
          pre_build: {
            commands: ["cd ./cdk", "npm ci"],
          },
          build: {
            commands: ["npm run build", "cdk deploy --all"],
          },
        },
      }),
    });
  }
}

export class InfraDeployStage extends cdk.Stage {
  public readonly infraDeployStack: InfraDeployStack;

  constructor(
    scope: constructs.Construct,
    id: string,
    props: InfraDeployStackProps
  ) {
    super(scope, id, props);

    this.infraDeployStack = new InfraDeployStack(
      this,
      INFRA_DEPLOY_STACK_ID,
      props
    );
  }
}
