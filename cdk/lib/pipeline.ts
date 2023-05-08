import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";

const PIPELINE_ID = "Pipeline";
const PIPELINE_NAME = "Pipeline";
const SYNTH_ID = "Synth";
const REPO = "initialed85/github-cdk-testing";
const BRANCH = "master";

export interface PipelineStackProps extends cdk.StackProps {
  readonly githubTokenSecretName: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, PIPELINE_ID, {
      pipelineName: PIPELINE_NAME,
      synth: new ShellStep(SYNTH_ID, {
        input: CodePipelineSource.gitHub(REPO, BRANCH, {
          authentication: cdk.SecretValue.secretsManager(
            props.githubTokenSecretName,
            {}
          ),
        }),
        installCommands: ["cd cdk", "npm ci"],
        commands: ["npm run build", "npx cdk synth"],
      }),
    });
  }
}
