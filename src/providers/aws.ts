
import { config } from 'aws-sdk'; 
export async function loginToAws() {
    return config.update({
        accessKeyId: 'AKIAZGQIXN2MLBWEHT6Z',
        secretAccessKey: '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'
        });
}