const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { NOTIFICATION_TYPE, User } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createNewAssignedTappNotification } from "../notifications/NotificationFactory";
import {  USER_PATH } from "../paths";
import { createNewUserNotification, getDocumentsFromQuerySnapshot } from "../util";
import { TappMutatedProps } from "./util";

export const handleTappCreate = async (props: TappMutatedProps) => {
  functions.logger.log('handleTappCreate: ', props);
  const {owner, phoneNumbersToNotify, task} = props;
  
  
  const userDocsRef = db.collection(USER_PATH);
  const userDocs = await userDocsRef.where('phone', 'in', phoneNumbersToNotify).get();
  const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
  functions.logger.log('userDocs', userDocs);
  
  const batch = db.batch();
  let usersToNotify: string[] = [];

  // Create a new UserNotification document for each User
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const notification = createNewUserNotification({user: user.id, type: NOTIFICATION_TYPE.ASSIGNED_TAPP, task: task, message: `${owner} has assigned you a Tapp`})
    const {notificationRef, newNotification} = notification;
    batch.set(notificationRef, newNotification);
    usersToNotify.push(user.fcmToken);
  }
  functions.logger.log('usersToNotify', usersToNotify);
  batch.commit();

  const notification: NotificationInstruction = {
    recipients: usersToNotify,
    content: createNewAssignedTappNotification(owner),
    payload: {
      tapp: task,
    },
  };

  sendNotifications(notification);

};