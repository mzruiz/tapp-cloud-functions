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

const ACCOUNT_SID = process.env.ACCOUNT_SID
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
// const ROOM_NAME = '';
// const PASSCODE = '';

export const createTwilioRoom = async (tapp: Task, user: User) => {
  functions.logger.log('createTwilioRoom: ', tapp, user);
  
  // The VideoGrant will give the generated access token (which is needed by the User to get into the Conference)
  // permission to stream their camera
  const identity = user.phone;
  const videoGrant = new VideoGrant({
    room: tapp.id,
  });
  
  const token = new AccessToken(ACCOUNT_SID, API_KEY, API_SECRET, {identity});
  token.addGrant(videoGrant);
  functions.logger.log('token: ', token);

  // Add Conference doc to Firebase
  const conference: TwilioConference = {
    id: db.collection(TWILIO_CONFERENCE_PATH).doc().id,
    tapp: tapp.id,
    createdAt: Date.now(),
    isStale: false,
  };
  await db.collection(TWILIO_CONFERENCE_PATH).doc(conference.id).set(conference);

  // Create the Video Conference (in Twilio) using the Tapp id as the unique identifier.
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

const sendNewVideoCallNotification = async (collaborators: string[], initiator: string, tapp: Task, conference: string) => {
  const taskAssigneesRef = db.collection(TASK_ASSIGNEE_PATH);
  const taskAssigneeDocs = await taskAssigneesRef.where('id', 'in', collaborators).get();
  
  // Get Collaborators to notify
  const taskAssignees = getDocumentsFromQuerySnapshot(taskAssigneeDocs) as UserAssignee[];
  functions.logger.log('taskAssigneeDocs', taskAssigneeDocs);

  // List of Contacts to retrieve
  const contactIds = taskAssignees.map(taskAssignee => taskAssignee.contactId);

  const contactsRef = db.collection(CONTACT_PATH);
  const contactsDocs = await contactsRef.where('id', 'in', contactIds).get();

  const contacts = getDocumentsFromQuerySnapshot(contactsDocs) as Contact[];
  functions.logger.log('contacts', contacts);

  // List of Users to retrieve
  const userPhones = contacts.map(contact => contact.phone);

  const usersRef = db.collection(USER_PATH);
  const userDocs = await usersRef.where('phone', 'in', userPhones).get();

  const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
  functions.logger.log('users', users);

  // List of FCM Tokens that we use to send notification
  const tokens = users.map(user => user.fcmToken);

  try {
    const notification: NotificationInstruction = {
      recipients: tokens,
      content: createVideoCallStartedNotification(initiator, tapp.title),
      payload: {
        tapp: tapp.id, // Used by the app to take the User to the Tapp
        conference,
      },
    };
  
    sendNotifications(notification);
  } catch (e) {
    functions.logger.error('error sending Tapp message notification: ', e);
  }

};