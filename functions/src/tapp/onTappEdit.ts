const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { NOTIFICATION_TYPE, Task, User, UserNotification } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createTappAcceptedNotification, createTappEditNotification } from "../notifications/NotificationFactory";
import { USER_NOTIFICATION_PATH, USER_PATH } from "../paths";
import { createNewUserNotification, getDocumentsFromQuerySnapshot } from "../util";
import { TappMutatedProps } from "./util";

export const handleTappEdit = async (props: TappMutatedProps) => {
  functions.logger.log('handleTappEdit: ', props);
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
      type: NOTIFICATION_TYPE.TAPP_UPDATED,
      task,
      message: owner
    };
    batch.set(notificationRef, newNotification);
    usersToNotify.push(user.fcmToken);
  }
  functions.logger.log('usersToNotify', usersToNotify);
  batch.commit();

  const notification: NotificationInstruction = {
    recipients: usersToNotify,
    content: createTappEditNotification(owner),
    payload: {
      tapp: task,
    },
  };

  sendNotifications(notification);

};

type AcceptRejectTappProps = {
  accepter: string; // Name
  task: Task;
  ownerToNotify: User;
};

export const handleAcceptTapp = async (props: AcceptRejectTappProps) => {
  const {accepter, task, ownerToNotify} = props;
  functions.logger.log('handleAcceptTapp: ', props);

  let message = `${accepter} has accepted your invite to ${task.title}`;

  const {notificationRef, newNotification} = createNewUserNotification({user: ownerToNotify.id, type: NOTIFICATION_TYPE.ACCEPTED_TAPP, task: task.id, message});
  const batch = db.batch();
  batch.set(notificationRef, newNotification);
  batch.commit();

  const notification: NotificationInstruction = {
    recipients: [ownerToNotify.fcmToken],
    content: createTappAcceptedNotification(message),
    payload: {
      tapp: task.id,
    },
  };

  sendNotifications(notification);

};

export const handleRejectTapp = async (props: AcceptRejectTappProps) => {
  const {accepter, task, ownerToNotify} = props;
  functions.logger.log('handleRejectTapp: ', props);

  let message = `${accepter} has rejected your invite to ${task.title}`;

  const {notificationRef, newNotification} = createNewUserNotification({user: ownerToNotify.id, type: NOTIFICATION_TYPE.REJECTED_TAPP, task: task.id, message});
  const batch = db.batch();
  batch.set(notificationRef, newNotification);
  batch.commit();

  const notification: NotificationInstruction = {
    recipients: [ownerToNotify.fcmToken],
    content: createTappAcceptedNotification(message),
    payload: {
      tapp: task.id,
    },
  };

  sendNotifications(notification);

};