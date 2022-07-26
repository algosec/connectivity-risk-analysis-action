
import { config } from 'aws-sdk'; 
export function loginToAws() {
    config.getCredentials(function(err) {
        if (err) console.log(err.stack);
        // credentials not loaded
        else {
          console.log("Region:", config.region);
        }
    });
}