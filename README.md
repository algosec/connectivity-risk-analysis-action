<p align="left">
  <a href="https://www.algosec.com"><img height="30" alt="Algosec" src="https://raw.githubusercontent.com/algosec/action-test/develop/icons/critical.png"></a>
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
        - name: debug
          uses: hmarr/debug-action@v2
        - name: Algosec Risk Analysis Action
          uses: algosec/risk-analysis-action@v0.0.2
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            GITHUB_SHA: ${{ github.sha }}
            GITHUB_WORKSPACE: ${{ github.workspace }}
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
            CF_API_URL: ${{ secrets.CF_API_URL }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_LOGIN_API: ${{ secrets.CF_LOGIN_API }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            FRAMEWORK_TYPE: terraform
            VCS_TYPE: github
```

Use this template to add Code Analysis Action on IaC repository.

This template includes the needed environment variables for the next run

## Use this action

Click the `Use this Template` and provide the new repo details for your action

```

## Change action.yml

The action.yml defines the inputs and output for your action.
