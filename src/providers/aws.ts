
import { config } from 'aws-sdk'; 
import{getInput } from '@actions/core'

export async function loginToAws() {
    const accessKeyId = getInput('AWS_ACCESS_KEY_ID')
    const secretAccessKey = getInput('AWS_SECRET_ACCESS_KEY')

    return config.update({
        accessKeyId,
        secretAccessKey
        });
}