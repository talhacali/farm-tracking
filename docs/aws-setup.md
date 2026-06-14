# AWS Infrastructure Setup

This runbook documents every AWS resource required to run Farm Tracking in production.
Provision these resources before running the first deployment via GitHub Actions.

---

## Prerequisites

- AWS CLI v2 configured with admin access
- Domain verified in Route 53 (for SES)
- GitHub repository with Actions enabled

---

## 1. ECR Repository

```bash
aws ecr create-repository \
  --repository-name farm-tracking \
  --region us-east-1
```

---

## 2. RDS PostgreSQL

Provision via AWS Console or CLI:

- Engine: PostgreSQL 16
- Instance class: `db.t4g.micro` (MVP)
- Multi-AZ: No (enable for production traffic)
- VPC: Place in **private subnet** — no public internet access
- Database name: `farm_tracking`
- Enable automated backups (7-day retention)

Note the endpoint — used for `DATABASE_URL`.

---

## 3. S3 Bucket (Thermal Image Storage)

```bash
aws s3api create-bucket \
  --bucket farm-tracking-scans \
  --region us-east-1

# Block all public access
aws s3api put-public-access-block \
  --bucket farm-tracking-scans \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

---

## 4. CloudFront Distribution

- Origin: The S3 bucket above
- Origin Access Control (OAC): Create and attach to the distribution
- Default cache behavior: Viewer Protocol Policy = Redirect HTTP to HTTPS
- Price class: PriceClass_100 (US, Canada, Europe)

Note the distribution domain — used for `CLOUDFRONT_DOMAIN`.

---

## 5. SES Domain Verification

```bash
# Request domain identity verification
aws sesv2 create-email-identity \
  --email-identity yourdomain.com \
  --region us-east-1
```

Add the DNS records provided to Route 53, then move out of SES sandbox:
- Request production access in the AWS Console (SES → Account dashboard → Request production access)

Set `SES_FROM_ADDRESS` to a verified sender address, e.g. `alerts@yourdomain.com`.

---

## 6. AWS Secrets Manager

Store each secret individually:

```bash
aws secretsmanager create-secret --name farm-tracking/DATABASE_URL \
  --secret-string "postgresql://user:pass@rds-endpoint:5432/farm_tracking"

aws secretsmanager create-secret --name farm-tracking/AUTH_SECRET \
  --secret-string "$(openssl rand -base64 32)"

aws secretsmanager create-secret --name farm-tracking/S3_BUCKET_NAME \
  --secret-string "farm-tracking-scans"

aws secretsmanager create-secret --name farm-tracking/S3_REGION \
  --secret-string "us-east-1"

aws secretsmanager create-secret --name farm-tracking/CLOUDFRONT_DOMAIN \
  --secret-string "dXXXXXXXXXXXX.cloudfront.net"

aws secretsmanager create-secret --name farm-tracking/SES_FROM_ADDRESS \
  --secret-string "alerts@yourdomain.com"

aws secretsmanager create-secret --name farm-tracking/SENTRY_DSN \
  --secret-string "https://xxx@oXXX.ingest.sentry.io/XXX"
```

---

## 7. ECS Task Execution Role

Create an IAM role `farm-tracking-task-execution-role` with:
- `AmazonECSTaskExecutionRolePolicy` (managed)
- Inline policy for Secrets Manager access:

```json
{
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:farm-tracking/*"
  }]
}
```

---

## 8. ECS Task Role

Create an IAM role `farm-tracking-task-role` with:

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::farm-tracking-scans/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

---

## 9. ECS Cluster & Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name farm-tracking-cluster

# Create task definition (farm-tracking-task-definition.json) then register:
aws ecs register-task-definition --cli-input-json file://farm-tracking-task-definition.json

# Create service
aws ecs create-service \
  --cluster farm-tracking-cluster \
  --service-name farm-tracking-service \
  --task-definition farm-tracking \
  --launch-type FARGATE \
  --desired-count 1 \
  --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200" \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

The ECS task definition injects Secrets Manager values as environment variables:
```json
{
  "family": "farm-tracking",
  "containerDefinitions": [{
    "name": "farm-tracking",
    "image": "<ecr-uri>/farm-tracking:latest",
    "portMappings": [{"containerPort": 3000}],
    "secrets": [
      { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/DATABASE_URL" },
      { "name": "AUTH_SECRET",  "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/AUTH_SECRET" },
      { "name": "S3_BUCKET_NAME", "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/S3_BUCKET_NAME" },
      { "name": "S3_REGION", "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/S3_REGION" },
      { "name": "CLOUDFRONT_DOMAIN", "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/CLOUDFRONT_DOMAIN" },
      { "name": "SES_FROM_ADDRESS", "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/SES_FROM_ADDRESS" },
      { "name": "SENTRY_DSN", "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:farm-tracking/SENTRY_DSN" }
    ],
    "environment": [
      { "name": "NEXTAUTH_URL", "value": "https://yourdomain.com" },
      { "name": "NODE_ENV", "value": "production" }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/farm-tracking",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }],
  "cpu": "512",
  "memory": "1024",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "executionRoleArn": "arn:aws:iam::<account>:role/farm-tracking-task-execution-role",
  "taskRoleArn": "arn:aws:iam::<account>:role/farm-tracking-task-role"
}
```

---

## 10. GitHub Actions OIDC Role

Create an IAM role `farm-tracking-github-actions` with:

Trust policy:
```json
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<org>/farm-tracking:*" }
    }
  }]
}
```

Permissions: `ecr:*`, `ecs:UpdateService`, `ecs:RegisterTaskDefinition`, `ecs:DescribeTaskDefinition`, `ecs:DescribeServices`, `ecs:DescribeTasks`, `ecs:ListTasks`, `iam:PassRole` (scoped to task roles).

---

## 11. GitHub Actions Secrets

In your GitHub repository → Settings → Secrets and variables → Actions:

| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::<account>:role/farm-tracking-github-actions` |

In Repository Variables (not Secrets):

| Name | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |
