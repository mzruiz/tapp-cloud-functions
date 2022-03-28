import * as functions from "firebase-functions";
import { Task, TwilioConference } from "../model";
import { TWILIO_CONFERENCE_PATH } from "../paths";
const admin = require('firebase-admin');
const db = admin.firestore();
const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const ACCOUNT_SID = 'ACc8e037ac84ccb99cbf68c1e13775b3d9';
const API_KEY = 'SK7395a87a2e8930bc996be2759142fc37';
const API_SECRET = '0IXim0b7zFSfMOiiOC2jv4BSJLOLUbJb';
const AUTH_TOKEN = 'b336da7588252065bb8745dd84bc849a';
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
// const ROOM_NAME = '';
// const PASSCODE = '';

export const createTwilioRoom = async (tapp: Task, user: string) => {
  functions.logger.log('createTwilioRoom: ', tapp, user);
  
  const identity = user;
  const videoGrant = new VideoGrant({
    room: tapp.id,
  });
  
  const token = new AccessToken(ACCOUNT_SID, API_KEY, API_SECRET, {identity});
  token.addGrant(videoGrant);
  functions.logger.log('token: ', token);

  const ref = db.collection(TWILIO_CONFERENCE_PATH).doc();
  const conference: TwilioConference = {
    id: ref.id,
    tapp: tapp.id,
    token: token.toJwt(),
    createdAt: Date.now(),
    isStale: false,
  };
  await db.collection(TWILIO_CONFERENCE_PATH).doc(conference.id).set(conference);

  client.video.rooms.create({uniqueName: tapp.id, type: 'peer-to-peer'}).then((room: any) => {
    return functions.logger.log('room created: ', room, room.sid);
  });

  return conference;
};

export const connectToTwilioRoom = async (tapp: string, user: string) => {
  functions.logger.log('connectToTwilioRoom: ', tapp);
  
  const identity = user;
  const videoGrant = new VideoGrant({
    room: tapp,
  });
  
  const token = new AccessToken(ACCOUNT_SID, API_KEY, API_SECRET, {identity});
  token.addGrant(videoGrant);
  functions.logger.log('token: ', token);

  return token.toJwt();
};