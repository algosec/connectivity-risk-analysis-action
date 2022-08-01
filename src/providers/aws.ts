
import { config } from 'aws-sdk'; 
import{getInput } from '@actions/core'

export async function loginToAws() {
    config.getCredentials(function(err) {
        if (err) console.log(err.stack);
            // credentials not loaded
        else {
              console.log("aws region:", config.region);
            }
    });
}