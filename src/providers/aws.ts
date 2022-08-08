
import AWS, { config } from 'aws-sdk'; 
import{debug, getInput, setFailed } from '@actions/core'
import { s3Client } from './s3Client'
import { CloudProvider } from './provider.model';
import { context } from '@actions/github';
import { PutObjectCommand, PutObjectCommandInput, PutObjectOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpClient } from '@actions/http-client';

export class AwsProvider implements CloudProvider {
    s3Dest: string
    actionUuid: string

    constructor(actionUuid: string, s3Dest: string){
        this.s3Dest = s3Dest
        this.actionUuid = actionUuid
    }

    async login() {
        config.getCredentials(function(err) {
            if (err) console.log(err.stack);
                // credentials not loaded
            else {
                  console.log("aws region:", config.region);
                }
        });
    }

    async uploadToS3(keyName: string, body: any): Promise<any> {
        const http = new HttpClient()
    
        // Set the parameters.
   const bucketParams: PutObjectCommandInput = {
    Bucket: this.s3Dest,
    ACL: 'bucket-owner-full-control',
    Body: body,
    Key: `github-codeanalysis/tmp${keyName}.out`,
    Metadata: {customer: context.repo.owner, action_id: this.actionUuid}
  };
  const command = new PutObjectCommand(bucketParams)
  // Create the presigned URL.
  const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
  });
  const response = await http.put(signedUrl, JSON.stringify(bucketParams.Body));
  if (response.message.statusCode == 200){
    return response
  } else {
    setFailed(response.message.statusMessage)
  }

        // debug(`got the following bucket name ${bucketName}`);
        // const s3 = new AWS.S3();
        // const objectParams: AWS.S3.Types.PutObjectRequest = {
        //   Bucket: this.s3Dest,
        //   ACL: 'bucket-owner-full-control',
        //   Body: body,
        //   Key: 'tmp' + keyName + '.out',
        //   Metadata: {customer: context.repo.owner, action_id: actionUuid}
      
        // };
        // return s3.putObject(objectParams).promise();
      }
    
}




