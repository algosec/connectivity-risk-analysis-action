<a href="#"><img height="100" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/header.svg" /></a>
The IaC Connectivity Risk Analysis GitHub Action runs on the current repository and return risks analysis for any changes in IaC framework.

### Basic Configuration
Here is an example of all possible parameters passed as environment variables to the action. 
Take into consideration that GitHub and AlgoSec CloudFlow credentials are mandatory in order to run this action, along with the credentials of the provider/s used (you can see in the next section, Cloud Providers COnfiguration).

Example usage 

```yaml
name: 'Your Repo CI/CD Yaml Workflow'
on:
  pull_request:
    branches:
      - 'main'
jobs:
  algosec-iac-connectivity-risk-analysis:
     name: 'Algosec IAC Connectivity Risk Analysis'
     runs-on: ubuntu-latest
     steps:
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v0.0.1
          env:
            # Github's Private Access Token
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  
            # CloudFlow credentials
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            
            # Add your provider's keys to environment variables 
            # as secrets or use an external action to preconfigure
            
```


## Cloud Providers configuration
In order to run IaC on a specific provider, it is required to pass an authentication in one of the following options:

- Environment variables - most cloud providers will authenticate automatically using environment variables
- Action - if environment variables aren't an option, try looking for an action for this provider, using the GitHub marketplace

### AWS

Example usage 
```yaml
name: 'Your Repo CI/CD Yaml Workflow'
on:
  pull_request:
    branches:
      - 'main'
jobs:
  algosec-iac-connectivity-risk-analysis:
     name: 'Algosec IAC Connectivity Risk Analysis'
     runs-on: ubuntu-latest
     steps:
          uses: algosec/connectivity-risk-analysis-action@v0.0.12
          env:            
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}  
            # Use AWS Environment Variables or
            # an external Action to authenticate with provider
            # https://github.com/marketplace/actions/configure-aws-credentials-action-for-github-actions
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}   
            
```

### Azure

Example usage 
```yaml
name: 'Your Repo CI/CD Yaml Workflow'
on:
  pull_request:
    branches:
      - 'main'
jobs:
  algosec-iac-connectivity-risk-analysis:
     name: 'Algosec IAC Connectivity Risk Analysis'
     runs-on: ubuntu-latest
     steps:
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v0.0.12
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            # Use AWS Environment Variables or
            # an external Action to authenticate with provider
            # https://github.com/marketplace/actions/azure-login
            ARM_SUBSCRIPTION_ID: ${{ secrets.AZ_SUBSCRIPTION_ID }}
            ARM_TENANT_ID: ${{ secrets.AZ_TENANT_ID }}
            ARM_CLIENT_ID: ${{ secrets.AZ_CLIENT_ID }}
            ARM_CLIENT_SECRET: ${{ secrets.AZ_CLIENT_SECRET }}
            
```

### Gcp

Example usage 
 ```yaml
name: 'Your Repo CI/CD Yaml Workflow'
on:
  pull_request:
    branches:
      - 'main'
jobs:
  algosec-iac-connectivity-risk-analysis:
     name: 'Algosec IAC Connectivity Risk Analysis'
     runs-on: ubuntu-latest
     steps:
          # use @actions/checkout@v3 to checkout the repo 
          # and add "USE_CHECKOUT: true" under "env:"
          
        - name: Checkout Repo
          uses: @actions/checkout@v3
          
          # Need to use @actions/checkout@v3 before Authenticate Google Cloud action
          # Read how to create GCP_CREDENTIALS key from GCP Json file:
          # https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference
          # Auth Gcp Action 
          # https://github.com/google-github-actions/auth
        - name: Authenticate to Google Cloud
          uses: google-github-actions/auth@v0.7.3
          with:
            credentials_json: '${{ secrets.GCP_CREDENTIALS }}'
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v0.0.12
          env:    
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            # By default the action doesn't need actions/checkout, so we need to specify its usage
            USE_CHECKOUT: true
            
```           
