const admin = require("firebase-admin");
admin.initializeApp();
import * as functions from "firebase-functions";
import { handleTappCreate } from "./tapp/onTappCreate";
import { handleTappMessageSent } from "./tapp/onTappMessageSent";
import {createTwilioRoom, connectToTwilioRoom} from "./twilio/createRoom";

export const createTappRoom = functions.https.onCall(async (request: any) => {
  functions.logger.log("createTappRoom");
  return createTwilioRoom(request.tapp, request.user);
});

export const connectToTappRoom = functions.https.onCall(async (request: any) => {
  functions.logger.log("connectToTappRoom");
  return connectToTwilioRoom(request.tapp, request.user);
});

export const createNotificationsForNewTapp = functions.https.onCall(async (request: any) => {
  handleTappCreate(request);
});

export const onTappMessageSent = functions.https.onCall(async (request: any) => {
  handleTappMessageSent(request);
});