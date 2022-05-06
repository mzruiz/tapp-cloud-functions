const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { NOTIFICATION_TYPE, Task, TaskAssignee, User, UserNotification } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createTappDeletedNotification } from "../notifications/NotificationFactory";
import { TASK_ASSIGNEE_PATH, USER_NOTIFICATION_PATH } from "../paths";
import { createNewUserNotification, getDocumentsFromQuerySnapshot } from "../util";

export const handleTappDelete = async (tapp: Task, owner: User, usersToNotify: User[]) => {
  functions.logger.log('handleTappDelete: ', tapp.id);
  // Delete TaskAssignees
  try {
    const taskAssigneeToDeleteBatch = db.batch();
  
    const taskAssigneeDocsRef = db.collection(TASK_ASSIGNEE_PATH);
    const taskAssigneeDocs = await taskAssigneeDocsRef.where('task', '==', tapp.id).get();
    const taskAssignees = getDocumentsFromQuerySnapshot(taskAssigneeDocs) as TaskAssignee[];
    functions.logger.log('taskAssignees', taskAssignees);
  
    taskAssignees.map(taskAssignee => {
      const taskAssigneeRef = db.collection(TASK_ASSIGNEE_PATH).doc(taskAssignee.id);
      taskAssigneeToDeleteBatch.delete(taskAssigneeRef);
    });
  
    taskAssigneeToDeleteBatch.commit();
    functions.logger.log(`TaskAssignees for Tapp (${tapp.id})) have successfully been deleted.`);
  } catch (error) {
    functions.logger.error(`TaskAssignees for Tapp (${tapp.id})) have been deleted. Error: ${error}`);
  }
  
  // Delete Notifications
  try {
    const notificationsToDeleteBatch = db.batch();
  
    const notificationDocsRef = db.collection(USER_NOTIFICATION_PATH);
    const notificationDocs = await notificationDocsRef.where('task', '==', tapp.id).get();
    const notifications = getDocumentsFromQuerySnapshot(notificationDocs) as UserNotification[];
    functions.logger.log('notifications', notifications);
  
    notifications.map(notification => {
      functions.logger.log('notification: ', notification);
      const notificationRef = db.collection(USER_NOTIFICATION_PATH).doc(notification.id);
      notificationsToDeleteBatch.delete(notificationRef);
    });
  
    notificationsToDeleteBatch.commit();
    functions.logger.log(`Notifications for Tapp (${tapp.id})) have successfully been deleted.`);
  } catch (error) {
    functions.logger.error(`Notifications for Tapp (${tapp.id})) have been deleted. Error: ${error}`);
  }

  // Add UserNotifications and send push notifications
  try {
    const userNotificationToCreateBatch = db.batch();
    let pushNotificationRecipients: string[] = [];
    const message = `${owner.firstName} has delete ${tapp.title}`;

    usersToNotify.map(user => {
      functions.logger.log('user for new user notification: ', user);

      const {notificationRef, newNotification} = createNewUserNotification({user: user.id, type: NOTIFICATION_TYPE.DELETED_TAPP, task: tapp.id, message});
      userNotificationToCreateBatch.set(notificationRef, newNotification);

      pushNotificationRecipients.push(user.fcmToken);
    });
    userNotificationToCreateBatch.commit();

    const deletedTappNotification: NotificationInstruction = {
      recipients: pushNotificationRecipients,
      content: createTappDeletedNotification(message),
      payload: {},
    };

    sendNotifications(deletedTappNotification);
  } catch (error) {}
};