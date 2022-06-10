const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { NOTIFICATION_TYPE, User } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createNewMessageNotification } from "../notifications/NotificationFactory";
import { USER_PATH } from "../paths";
import { createNewUserNotification, getDocumentsFromQuerySnapshot } from "../util";

type TappMessageSentProps = {
  sender: string; // name
  recipients: string[]; // phone
  message: string;
  task: string; // id
  messageThread: string; // id
};

export const handleTappMessageSent = async (props: TappMessageSentProps) => {
  const {sender, recipients, message, task, messageThread} = props;

  const userDocsRef = db.collection(USER_PATH);
  const userDocs = await userDocsRef.where('phone', 'in', recipients).get();
  const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
  functions.logger.log('users: ', users);

  const batch = db.batch();
  let usersToNotify: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const notification = createNewUserNotification({user: user.id, type: NOTIFICATION_TYPE.NEW_TAPP_MESSAGE, task: task, message: `${sender} has sent you a message`})
    const {notificationRef, newNotification} = notification;
    batch.set(notificationRef, newNotification);
    usersToNotify.push(user.fcmToken);
  }
  functions.logger.log('usersToNotify', usersToNotify);
  batch.commit();

  try {
    const notification: NotificationInstruction = {
      recipients: usersToNotify,
      content: createNewMessageNotification(sender, message),
      payload: {
        messageThread,
        tapp: task,
      }
    };
  
    sendNotifications(notification);
  } catch (e) {
    functions.logger.error('error sending Tapp message notification: ', e);
  }
};