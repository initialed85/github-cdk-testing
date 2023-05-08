import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";

const PIPELINE_ID = "InfraPipeline";
const PIPELINE_NAME = "InfraPipeline";
const SYNTH_ID = "Synth";

export interface PipelineStackProps extends cdk.StackProps {
  readonly githubTokenSecretName: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
}

export class InfraPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, PIPELINE_ID, {
      pipelineName: PIPELINE_NAME,
      synth: new ShellStep(SYNTH_ID, {
        input: CodePipelineSource.gitHub(props.githubRepo, props.githubBranch, {
          authentication: cdk.SecretValue.secretsManager(
            props.githubTokenSecretName,
            {}
          ),
        }),
        commands: ["cd cdk", "npm ci", "npm run build", "npx cdk synth"],
        primaryOutputDirectory: "cdk/cdk.out",
      }),
    });
  }
}
