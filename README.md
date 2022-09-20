<a href="#"><img height="100" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/header.svg" /></a>
The IaC Connectivity Risk Analysis GitHub Action runs on the current repository and return risks analysis for any changes in IaC framework.

### Basic Configuration
Here is an example of all possible parameters passed as environment variables to the action. 
Take into consideration that GitHub and AlgoSec CloudFlow credentials are mandatory in order to run this action, along with the credentials of the provider/s used (you can see in the next section, Cloud Providers COnfiguration).

#### Example usage 
First, create a new client id and client secret in your Algosec Cloudflow account using our access management module.<br>
then, add these variables to your github repo's secrets.<br>
now you'll be able to run the risks analysis process.

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
          uses: algosec/connectivity-risk-analysis-action@v0.0.19
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
### Action's parameters
|Parameter|Description|Required|Default|Type|
|---|---|---|---|---|
|GITHUB_TOKEN|Github PaT for checking diffs and commenting|Yes| |Secret Parameter|
|CF_TENANT_ID|Cloudflow tenant id for Authentication|Yes| |Secret Parameter|
|CF_CLIENT_ID|Cloudflow client id for Authentication|Yes| |Secret Parameter|
|CF_CLIENT_SECRET|Cloudflow client secret for Authentication|Yes| |Secret Parameter|
|FULL_ANALYSIS|Run checks on all folders with relevant file types|No|false|boolean|
|USE_CHECKOUT|Use actions/checkout action to checkout the current repo<br><b>Currently needed only for GCP Provider</b>|No|false|boolean|
|STOP_WHEN_FAIL|Runs checks without failing commit, failing will be only on Critical risks|No|false|boolean|
||||||
|<b>Providers Parameters</b>| | | | |
|<b>`AWS`</b>| | | | |
|AWS_ACCESS_KEY_ID|Customer's AWS access key id|No| |Secret Parameter|
|AWS_SECRET_ACCESS_KEY|Customer's AWS secret access key|No| |Secret Parameter|
|<b>`AZURE`</b>| | | | |
|ARM_SUBSCRIPTION_ID|Customer's Azure subscription id|No| |Secret Parameter|
|ARM_TENANT_ID|Customer's Azure tenant id|No| |Secret Parameter|
|ARM_CLIENT_ID|Customer's Azure access client id|No| |Secret Parameter|
|ARM_CLIENT_SECRET|Customer's Azure client secret|No| |Secret Parameter|
|<b>`GCP`</b>| | | | |
|GCP_CREDENTIALS|Customer's Google's Cloud credentials in a stringify() JSON|No| |Secret Parameter|

### Full Analysis
If you want to run check on all folders that contain IaC files, use the following example:

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
          uses: algosec/connectivity-risk-analysis-action@v0.0.19
          env:
            FULL_ANALYSIS: true
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            
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
          uses: algosec/connectivity-risk-analysis-action@v0.0.19
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
          uses: algosec/connectivity-risk-analysis-action@v0.0.19
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
          uses: algosec/connectivity-risk-analysis-action@v0.0.19
          env:  
            # By default our action doesn't require actions/checkout, 
            # but using the GCP Auth action requires us to specify its usage
            USE_CHECKOUT: true
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
           
            
```      

### Output(screenshots)

<a href="#"><img height="100" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/screenshot1.png" /></a>
<br>
<a href="#"><img height="100" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/screenshot2.png" /></a>
