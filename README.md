<p align="left">
  <a href="https://www.algosec.com"><img height="30" alt="Algosec" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/algosec_logo.png"></a>
</p>

# Run Code Analysis

```yaml
name: 'Your Repo CI/CD Yaml Workflow'
on:
  pull_request:
    branches:
      - 'main'
jobs:
  algosec-risk-analysis:
     name: 'Algosec Risk Analysis'
     runs-on: ubuntu-latest
     steps:
        - name: Algosec Risk Analysis Action
          uses: algosec/risk-analysis-action@v0.0.2
          env:
            # Fail or Continue on error after action finish (fail or continue_on_error)
            MODE: continue_on_error
            # IaS Framework type (terraform, cloudformation, etc...)
            FRAMEWORK: terraform
            # Version Control type (github, gitlab, etc...)
            VCS: github
            # Needed Github information
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            GITHUB_SHA: ${{ github.sha }}
            GITHUB_WORKSPACE: ${{ github.workspace }}
            
            # Cloudflow credentials
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            
            # Add your provider's keys to environment variables as secrets or use an external action to preconfigure
            
            # AWS Environment Variables/ External Action https://github.com/marketplace/actions/configure-aws-credentials-action-for-github-actions
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
            
            # AZURE Environment Variables/ External Action https://github.com/marketplace/actions/azure-login
            ARM_SUBSCRIPTION_ID=<azure_subscription_id>
            ARM_TENANT_ID=<azure_subscription_tenant_id>
            ARM_CLIENT_ID=<service_principal_appid>
            ARM_CLIENT_SECRET="<service_principal_password>
            
            # GCP Environment Variables/ External Action https://github.com/marketplace/actions/setup-google-cloud-sdk
            GOOGLE_APPLICATION_CREDENTIALS=<google_credentials_json>
            
```

Use this template to add Code Analysis Action on IaC repository.

This template includes the needed environment variables for the next run

## Use this action

Click the `Use this Template` and provide the new repo details for your action

```

## Change action.yml

The action.yml defines the inputs and output for your action.
