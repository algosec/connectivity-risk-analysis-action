<img height="100" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/header.svg" />

## IAC connectivity risk analysis

AlgoSec’s IAC connectivity risk analysis solution is an extensible security plugin platform that checks code for potential vulnerabilities before any commits are made to a repository. Accelerate application delivery taking a proactive, preventive, and collaborative approach within your CI/CD pipeline. 
The IaC Connectivity Risk Analysis GitHub Action runs on the current repositories, return risks analysis for any changes in IaC framework and gives remediation steps without a need to move to different applications or wait for security admin to manually review and approve that the code is risk free.

### Action parameters
|Parameter|Description|Required|Default|Type|
|---|---|---|---|---|
||||||
|<b>General Parameters</b>| | | | |
|`CF_REGION`|Cloudflow region us/anz|No|us |string|
|`FULL_ANALYSIS`|Run checks on all folders with relevant file types|No|false|boolean|
|`STOP_WHEN_FAIL`|The check will fail in case any risks are found|No|true|boolean|
||||||
|<b>Repository secrets</b>| | | | |
|`GITHUB_TOKEN`|Github PaT for checking diffs and commenting|Yes| |Secret Parameter|
|`CF_TENANT_ID`|Cloudflow tenant id|Yes| |Secret Parameter|
|`CF_CLIENT_ID`|Cloudflow client id|Yes| |Secret Parameter|
|`CF_CLIENT_SECRET`|Cloudflow client secret|Yes| |Secret Parameter|
|<b>*aws*</b>| | | | |
|`AWS_ACCESS_KEY_ID`|AWS access key id|No| |Secret Parameter|
|`AWS_SECRET_ACCESS_KEY`|AWS secret access key|No| |Secret Parameter|
|<b>*azure*</b>| | | | |
|`ARM_SUBSCRIPTION_ID`|Azure subscription id|No| |Secret Parameter|
|`ARM_TENANT_ID`|Azure tenant id|No| |Secret Parameter|
|`ARM_CLIENT_ID`|Azure access client id|No| |Secret Parameter|
|`ARM_CLIENT_SECRET`|Azure client secret|No| |Secret Parameter|
|<b>*gcp*</b>| | | | |
|`GCP_CREDENTIALS`|Google's Cloud credentials|No| |Secret Parameter|

### Basic Configuration
Here is an example of all possible parameters passed as environment variables to the action. 
Take into consideration that GitHub and AlgoSec CloudFlow credentials are mandatory in order to run this action, along with the credentials of the provider/s used (you can see in the next section, Cloud Providers Configuration).

#### Example usage 
First, create a new client id and client secret in your Algosec Cloudflow account using our access management module.<br>
Then, add these variables to your github repo's secrets.<br>
Now you'll be able to run the risks analysis process.

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
        - name: Checkout
          uses: actions/checkout@v3
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v1.0.0
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
        - name: Checkout
          uses: actions/checkout@v3
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v1.0.0
          env:
            FULL_ANALYSIS: true
            ######
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
        - name: Checkout
          uses: actions/checkout@v3
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v1.0.0
          env:            
            # Use AWS Environment Variables or
            # an external Action to authenticate with provider
            # https://github.com/marketplace/actions/configure-aws-credentials-action-for-github-actions
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }} 
            ######
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }} 
            
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
        - name: Checkout
          uses: actions/checkout@v3
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v1.0.0
          env:
            # Use Azure Environment Variables or
            # an external Action to authenticate with provider
            # https://github.com/marketplace/actions/azure-login
            ARM_SUBSCRIPTION_ID: ${{ secrets.AZ_SUBSCRIPTION_ID }}
            ARM_TENANT_ID: ${{ secrets.AZ_TENANT_ID }}
            ARM_CLIENT_ID: ${{ secrets.AZ_CLIENT_ID }}
            ARM_CLIENT_SECRET: ${{ secrets.AZ_CLIENT_SECRET }}
            ######
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            
```

### GCP

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
        - name: Checkout
          uses: actions/checkout@v3
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v1.0.0
          env:
            # Use GCP Environment Variable or
            # an external Action to authenticate with provider
            # Read how to create GCP_CREDENTIALS key from GCP Json file:
            # https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference
            GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}
            ######
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
           
            
```

### Advanced Configuration (includes multiple providers)

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
        - name: Checkout
          uses: actions/checkout@v3
        - name: Connectivity Risk Analysis
          uses: algosec/connectivity-risk-analysis-action@v1.0.0
          env:  
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            CF_REGION: 'anz'
            CF_TENANT_ID: ${{ secrets.CF_TENANT_ID }}
            CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
            CF_CLIENT_SECRET: ${{ secrets.CF_CLIENT_SECRET }}
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
            ARM_SUBSCRIPTION_ID: ${{ secrets.AZ_SUBSCRIPTION_ID }}
            ARM_TENANT_ID: ${{ secrets.AZ_TENANT_ID }}
            ARM_CLIENT_ID: ${{ secrets.AZ_CLIENT_ID }}
            ARM_CLIENT_SECRET: ${{ secrets.AZ_CLIENT_SECRET }}
            GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}
           
            
```      

### Output(screenshots)
<img width="500" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/screenshot2.png" />
<img height="500" src="https://raw.githubusercontent.com/algosec/risk-analysis-action/develop/icons/screenshot1.png" />

### Email/Teams/Slack Integrations

GitHub can send notifications via email and integrate with MS Teams and Slack. See GitHub documentation for instructions to configure notifications and integrations in the following links:


https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/configuring-notifications

https://github.com/marketplace/microsoft-teams-for-github

https://github.com/marketplace/slack-github

#### Note: Appearance of output may be subject to email/MS Teams/Slack capabilities.
