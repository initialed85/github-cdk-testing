import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

const BUILD_ID = "Build";
const BUILD_NAME = "Build";
const SYNTH_ID = "Synth";
const CDK_SYNTH_COMMANDS = [
  "cd cdk",
  "npm ci",
  "npm run build",
  "npx cdk synth",
];
const CDK_OUT_PATH = "cdk/cdk.out";

export interface AppBuildStackProps extends cdk.StackProps {
  readonly githubTokenSecretName: string;
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

    const project = new codebuild.PipelineProject(this, BUILD_ID, {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
      }),
    });
  }
}
