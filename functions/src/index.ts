const admin = require("firebase-admin");
admin.initializeApp();
import * as functions from "firebase-functions";
// import { Task } from "./model";
// import { handleTappCreate } from "./tapp/onTappCreate";
import {createTwilioRoom, connectToTwilioRoom} from "./twilio/createRoom";

export const createTappRoom = functions.https.onCall(async (request: any) => {
  functions.logger.log("createTappRoom");
  return createTwilioRoom(request.tapp, request.user);
});

export const connectToTappRoom = functions.https.onCall(async (request: any) => {
  functions.logger.log("connectToTappRoom");
  return connectToTwilioRoom(request.tapp, request.user);
});

export const onTappCreate = functions.firestore.document("task/{id}").onCreate(snapshot => {
  functions.logger.log('onTappCreate: 2');
  functions.logger.log("onTappCreatee");
  // handleTappCreate(snapshot.data() as Task);
});