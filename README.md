<p align="left">
  <a href="https://www.algosec.com"><img height="30" alt="Algosec" src="https://raw.githubusercontent.com/alonnalgo/action-test/main/icons/critical.png"></a>
</p>

# Run Risk Analysis

```yaml
name: 'Your Repo CI/CD Yaml Workflow'
on:
  pull_request:
    branches:
      - 'main'
jobs:
  algosec-risk-analysis-job:
     name: 'Risk Analysis Job'
     runs-on: ubuntu-latest
     steps:
      - name: 'Risk Analysis Action'
        uses: alonnalgo/action-test@v0.0.51
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-west-2
          AWS_S3: ${{ secrets.AWS_S3 }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_SHA: ${{ github.sha }}
          GITHUB_WORKSPACE: ${{ github.workspace }}
          RA_API_URL: ${{ secrets.RA_API_URL }}
          TF_API_TOKEN: ${{ secrets.TF_API_TOKEN }}
```

Use this template to add Risk Analysis Action on IaC repository.

This template includes the needed environment variables for the next run


## Use this action

Click the `Use this Template` and provide the new repo details for your action

```

## Change action.yml

The action.yml defines the inputs and output for your action.

