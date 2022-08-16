
import{ setFailed } from '@actions/core'
import { context } from '@actions/github';
import { HttpClient } from '@actions/http-client';

export class Aws  {


    async uploadToS3(actionUuid: string, body: any, jwt: string): Promise<any> {
        const http = new HttpClient()
        const getPresignedUrl = `${process?.env?.API_URL}/presignedurl?jwt=${jwt}&actionId=${actionUuid}&owner=${context.repo.owner}`
        const presignedUrlResponse = await (await http.get(getPresignedUrl)).readBody()
        const presignedUrl = JSON.parse(presignedUrlResponse).presignedUrl
        const response = await (await http.put(presignedUrl, body, {'Content-Type':'application/json'})).readBody()
        if (response == ''){
          return true
        } else {
          setFailed(response)
        }

    }
    
}




