# github-cdk-testing

This repo is a test project to try and demonstrate the following:

- React (TypeScript) frontend
    - Served from an S3 bucket via CloudFront
    - **TODO** - Make GET / POST interactions against the Go backend
    - **TODO** - Make WebSocket interactions with the Go backend
    - **TODO** - Support a login flow
- Go backend
    - Deployed as a Lambda via an ALB via CloudFront
    - **TODO** - Handle GET / POST interactions from the React backend
    - **TODO** - Handle WebSocket interactions from the React backend
    - **TODO** - Make interactions against the data store
    - **TODO** - Honour a login flow
- CDK (TypeScript) to deploy to AWS
    - With a focus on ease of creating alternate environments (e.g. dev, staging, prod)
    - **TODO** - Deploy a data store of some sort
- GitHub Actions to trigger everything
    - A release tag triggers a `prod` deployment
    - A commit to the `master` branch triggers a `staging` deployment
    - A commit to any other branch triggers a `dev` deployment

## Prerequisites

Ensure you've installed these (versions are just what I'm using):

- go 1.19.7
- node v18.16.0
- npm 9.5.1
- tsc 5.0.4
- jq jq-1.6
- aws-cli 2.11.17
- act 0.2.45

And ensure you have your `~/.aws/config` and `~/.aws/credentials` files set up- though if you'd prefer not to rely on
the AWS CLI, you can use these environment variables:

```shell
export AWS_ACCOUNT_ID="your account ID"
export AWS_ACCESS_KEY_ID="your access key ID"
export AWS_SECRET_ACCESS_KEY="your secret access key"
export AWS_DEFAULT_REGION="your default region"
```

## Usage

### Setup

```shell
cd frontend
npm ci

cd ../backend
go mod download

cd ../cdk
npm ci
npm install -g aws-cdk@2.78.0
```

### Test

```shell
./test.sh
```

### Build

```shell
./build.sh
```

### Deploy

```shell
ENVIRONMENT="dev-${USER}" ./deploy.sh
```

### Destroy

```shell
ENVIRONMENT="dev-${USER}" ./destroy.sh
```

Note: Implies `ENVIRONMENT=dev-${USER}`

## Interactions

Assuming you've already deployed, you can dump out the relevant URLs like so:

```shell
cat cdk/outputs.json | jq
{
  "devGitHubCdkTesting": {
    "cdnDistributiondistributionDomainName": "0123456789abcd.cloudfront.net",
    "contentBucketbucketDomainName": "devgithubcdktesting-contentbucket01234567-890abcdef012.s3.amazonaws.com",
    "albloadBalancerDnsName": "devGi-alb0A-BCDEFGHIJKLM-012345678.ap-southeast-2.elb.amazonaws.com"
  }
}
```

The S3 bucket for content is public so you can hit the content directly like this (HTTP or HTTPS):

```shell
curl -L https://devgithubcdktesting-contentbucket01234567-890abcdef012.s3.amazonaws.com/frontend/index.html
```

The ALB is also public so you can hit the root endpoint directly like this (HTTP only):

```shell
curl -L http://devGi-alb0A-BCDEFGHIJKLM-012345678.ap-southeast-2.elb.amazonaws.com/api/
```

Finally you can hit both in an optimised way via the CloudFront distribution like this (HTTP or HTTPS):

```shell
# will redirect to index.html
curl -L https://0123456789abcd.cloudfront.net/

# will be cached by URL because it's a GET
curl -L https://0123456789abcd.cloudfront.net/api/

# will not be cached because it's a POST
curl -L -X POST -H 'Content-Type: application/json' -d '{"hello": "world"}' https://0123456789abcd.cloudfront.net/api/
```

## Further info

### Environments

Usage of the `ENVIRONMENT` env var controls the environment you're deploying to- literally all it does is change the
prefix on the stack ID (which results in a completely separate stack).

So if you were to run this:

```shell
ENVIRONMENT="pr1234" ./deploy.sh
```

Your stack ID would be `pr1234EnvironmentGitHubCdkTesting`.

This feature is used in the GitHub Actions definitions to deploy to different environments based on the branch or tag;
e.g.:

- Commits to `master` branch result in a deployment to the `staging` environment
- Commits with a `v*.*.*` tag pattern result in a deployment to the `prod` environment

### GitHub Actions

GitHub Actions is hard to debug, fortunately we can use [act](https://github.com/nektos/act) to execute our workflows
locally using Docker.

To use this via the wrapper script (note: this will attempt a deploy to the `${USER}Dev` environment):

```shell
./run-github-actions-locally.sh
```
