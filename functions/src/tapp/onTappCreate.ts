const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { NOTIFICATION_TYPE, User, UserNotification } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createNewAssignedTappNotification } from "../notifications/NotificationFactory";
import { USER_NOTIFICATION_PATH, USER_PATH } from "../paths";
import { getDocumentsFromQuerySnapshot } from "../util";

type TappCreatedProps = {
  owner: string;
  phoneNumbersToNotify: string[];
  task: string;
};

export const handleTappCreate = async (props: TappCreatedProps) => {
  functions.logger.log('handleTappCreate: ', props);
  const {owner, phoneNumbersToNotify, task} = props;
  
  
  let usersToNotify: string[] = [];
  
  const userDocsRef = db.collection(USER_PATH);
  const userDocs = await userDocsRef.where('phone', 'in', phoneNumbersToNotify).get();
  functions.logger.log('userDocs', userDocs);
  
  const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
  
  const batch = db.batch();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const notificationRef = db.collection(USER_NOTIFICATION_PATH).doc();
    const newNotification: UserNotification = {
      id: notificationRef.id,
      user: user.id,
      hasBeenRead: false,
      createdDate: Date.now(),
      type: NOTIFICATION_TYPE.ASSIGNED_TAPP,
      task,
      message: `${owner} has assigned you a Tapp`
    };
    batch.set(notificationRef, newNotification);
    usersToNotify.push(user.fcmToken);
  }
  functions.logger.log('usersToNotify', usersToNotify);
  batch.commit();

  const notification: NotificationInstruction = {
    recipients: usersToNotify,
    content: createNewAssignedTappNotification(owner),
  };

  sendNotifications(notification);

};