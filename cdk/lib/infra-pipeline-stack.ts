import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as pipelines from "aws-cdk-lib/pipelines";

const INFRA_PIPELINE_ID = "InfraPipeline";
const INFRA_PIPELINE_NAME = "InfraPipeline";
const SYNTH_ID = "Synth";

export interface PipelineStackProps extends cdk.StackProps {
  readonly githubTokenSecretName: string;
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
}

export class InfraPipelineStack extends cdk.Stack {
  public pipeline: pipelines.CodePipeline;

  constructor(
    scope: constructs.Construct,
    id: string,
    props: PipelineStackProps
  ) {
    super(scope, id, props);

    const gitHub = pipelines.CodePipelineSource.gitHub(
      `${props.githubOwner}/${props.githubRepo}`,
      props.githubBranch,
      {
        authentication: cdk.SecretValue.secretsManager(
          props.githubTokenSecretName
        ),
      }
    );

    const shellStep = new pipelines.ShellStep(SYNTH_ID, {
      input: gitHub,
      commands: ["cd cdk", "npm ci", "npm run build", "npx cdk synth"],
      primaryOutputDirectory: "cdk/cdk.out",
    });

    this.pipeline = new pipelines.CodePipeline(this, INFRA_PIPELINE_ID, {
      pipelineName: INFRA_PIPELINE_NAME,
      synth: shellStep,
    });
  }
}
