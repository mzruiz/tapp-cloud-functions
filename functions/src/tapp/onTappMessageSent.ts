const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { NOTIFICATION_TYPE, User, UserNotification } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createNewMessageNotification } from "../notifications/NotificationFactory";
import { USER_NOTIFICATION_PATH, USER_PATH } from "../paths";
import { getDocumentsFromQuerySnapshot } from "../util";

type TappMessageSentProps = {
  sender: string; // name
  recipients: string[]; // phone
  message: string;
  task: string; // id
};

export const handleTappMessageSent = async (props: TappMessageSentProps) => {
  const {sender, recipients, message, task} = props;

  const userDocsRef = db.collection(USER_PATH);
  const userDocs = await userDocsRef.where('phone', 'in', recipients).get();

  const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
  functions.logger.log('users: ', users);

  const batch = db.batch();
  let usersToNotify: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const notificationRef = db.collection(USER_NOTIFICATION_PATH).doc();
    const newNotification: UserNotification = {
      id: notificationRef.id,
      user: user.id,
      hasBeenRead: false,
      createdDate: Date.now(),
      type: NOTIFICATION_TYPE.NEW_TAPP_MESSAGE,
      task,
      message: `${sender} has sent you a message`
    };
    batch.set(notificationRef, newNotification);
    usersToNotify.push(user.fcmToken);
  }
  functions.logger.log('usersToNotify', usersToNotify);
  batch.commit();

  try {
    const notification: NotificationInstruction = {
      recipients: usersToNotify,
      content: createNewMessageNotification(sender, message),
    };
  
    sendNotifications(notification);
  } catch (e) {
    functions.logger.error('error sending Tapp message notification: ', e);
  }
};