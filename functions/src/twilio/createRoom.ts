import * as functions from "firebase-functions";
import { Contact, Task, TwilioConference, User, UserAssignee } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createVideoCallStartedNotification } from "../notifications/NotificationFactory";
import { CONTACT_PATH, TASK_ASSIGNEE_PATH, TWILIO_CONFERENCE_PATH, USER_PATH } from "../paths";
import { getDocumentsFromQuerySnapshot } from "../util";
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

export const createTwilioRoom = async (tapp: Task, user: User) => {
  functions.logger.log('createTwilioRoom: ', tapp, user);
  
  const identity = user.phone;
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
    createdAt: Date.now(),
    isStale: false,
  };
  await db.collection(TWILIO_CONFERENCE_PATH).doc(conference.id).set(conference);

  client.video.rooms.create({uniqueName: tapp.id, type: 'peer-to-peer'}).then((room: any) => {
    return functions.logger.log('room created: ', room, room.sid);
  });

  sendNewVideoCallNotification(tapp.collaborators, user.firstName, tapp, conference.id);

  return {conference, token: token.toJwt()};
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

/**
 * TO DO: Handle when there are more than 10 taskAssignees on a Tapp
 * @param collaborators
 */
const sendNewVideoCallNotification = async (collaborators: string[], initiator: string, tapp: Task, conference: string) => {
  const taskAssigneesRef = db.collection(TASK_ASSIGNEE_PATH);
  const taskAssigneeDocs = await taskAssigneesRef.where('id', 'in', collaborators).get();
  
  // TO DO: Support Groups being a TaskAssignee
  const taskAssignees = getDocumentsFromQuerySnapshot(taskAssigneeDocs) as UserAssignee[];
  functions.logger.log('taskAssigneeDocs', taskAssigneeDocs);

  const contactIds = taskAssignees.map(taskAssignee => taskAssignee.contactId);

  const contactsRef = db.collection(CONTACT_PATH);
  const contactsDocs = await contactsRef.where('id', 'in', contactIds).get();

  const contacts = getDocumentsFromQuerySnapshot(contactsDocs) as Contact[];
  functions.logger.log('contacts', contacts);

  const userPhones = contacts.map(contact => contact.phone);

  const usersRef = db.collection(USER_PATH);
  const userDocs = await usersRef.where('phone', 'in', userPhones).get();

  const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
  functions.logger.log('users', users);

  const tokens = users.map(user => user.fcmToken);

  try {
    const notification: NotificationInstruction = {
      recipients: tokens,
      content: createVideoCallStartedNotification(initiator, tapp.title),
      payload: {
        tapp: tapp.id,
        conference,
      },
    };
  
    sendNotifications(notification);
  } catch (e) {
    functions.logger.error('error sending Tapp message notification: ', e);
  }

};