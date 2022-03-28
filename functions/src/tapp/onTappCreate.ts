const admin = require('firebase-admin');
const db = admin.firestore();
import * as functions from "firebase-functions";
import { Contact, Task, User, UserAssignee } from "../model";
import { sendNotifications } from "../notifications/Dispatcher";
import { NotificationInstruction } from "../notifications/model";
import { createNewAssignedTappNotification } from "../notifications/NotificationFactory";
import { CONTACT_PATH, TASK_ASSIGNEE_PATH, USER_PATH } from "../paths";
import { getDocumentsFromQuerySnapshot } from "../util";

export const handleTappCreate = async (tapp: Task) => {
  functions.logger.log('handleTappCreate: ', tapp);
  const taskAssigneeRef = db.collection(TASK_ASSIGNEE_PATH);
  const taskAssigneeDocs = await taskAssigneeRef.where('id', 'in', tapp.collaborators).get();
  functions.logger.log('taskAssigneeDocs: ', taskAssigneeDocs);
  const taskAssignees = getDocumentsFromQuerySnapshot(taskAssigneeDocs) as UserAssignee[];
  functions.logger.log('taskAssignees', taskAssignees);
  
  const contactIds = taskAssignees.map(t => t.contactId);
  functions.logger.log('contactIds', contactIds);
  const contactDocs = await db.collection(CONTACT_PATH).where('id', 'in', contactIds);
  const contacts = getDocumentsFromQuerySnapshot(contactDocs) as Contact[];
  
  let usersToNotify: string[] = [];
  
  for (let i = 0; i < contacts.length; i++) {
    const userDocs = await db.collection(USER_PATH).where('phone', '==', contacts[i].phone);
    const users = getDocumentsFromQuerySnapshot(userDocs) as User[];
    
    if (users.length > 0) {
      const user = users[0];
      if (user.id !== tapp.owner) {
        usersToNotify.push(user.fcmToken);
      }
    }
  }
  functions.logger.log('usersToNotify', usersToNotify);

  const owner = await db.collection(USER_PATH).doc(tapp.owner).get() as User;

  const notification: NotificationInstruction = {
    recipients: usersToNotify,
    content: createNewAssignedTappNotification(owner.firstName),
  };

  sendNotifications(notification);
};