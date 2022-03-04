import * as functions from "firebase-functions";
import getAccessToken from "./twilio/getAccessToken";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const getTwilioAccessToken = functions.https.onRequest((request: any) => {
  functions.logger.log("getTwilioAccessToken");
  getAccessToken();
});
