
import { config } from 'aws-sdk'; 
import{getInput } from '@actions/core'

export async function loginToAws() {
    const accessKeyId = getInput('AWS_ACCESS_KEY_ID')
    const secretAccessKey = getInput('AWS_SECRET_ACCESS_KEY')

    config.update({
        accessKeyId,
        secretAccessKey
        });
    config.getCredentials(function(err) {
        if (err) console.log(err.stack);
            // credentials not loaded
        else {
              console.log("aws region:", config.region);
            }
    });
}