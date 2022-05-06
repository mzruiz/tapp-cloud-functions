import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import * as functions from "firebase-functions";
import { USER_NOTIFICATION_PATH } from "./paths";
import { NOTIFICATION_TYPE, UserNotification } from "./model";
const admin = require('firebase-admin');
const db = admin.firestore();

export const getDocumentsFromQuerySnapshot = (snapshot: QueryDocumentSnapshot) => {
  functions.logger.log('snapshot without.data: ', snapshot);
  functions.logger.log('snapshot foreach');
  
  // @ts-ignore
  if (snapshot.empty) {
    functions.logger.log('No matching documents');
    return;
  }
  const documents: any[] = [];
  // @ts-ignore
  snapshot.forEach(doc => documents.push(doc.data()));
  return documents;
};

type NewUserNotificationProps = {
  user: string;
  type: NOTIFICATION_TYPE,
  task: string;
  message: string;
};

export const createNewUserNotification = (props: NewUserNotificationProps) => {
  const {user, task, type, message} = props;
  const notificationRef = db.collection(USER_NOTIFICATION_PATH).doc();
  const newNotification: UserNotification = {
    id: notificationRef.id,
    user,
    hasBeenRead: false,
    createdDate: Date.now(),
    type,
    task,
    message,
  };
  return {notificationRef, newNotification};
};