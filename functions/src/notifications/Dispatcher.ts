import { NotificationContent, NotificationInstruction } from "./model";
import admin = require('firebase-admin');
import functions = require('firebase-functions');

export const sendNotifications = (instruction: NotificationInstruction) => {
  const {recipients, content} = instruction;
  // getFCMTokens(recipients);
  recipients.map(recipient => {
    sendNotification(recipient, content);
  });
};

const sendNotification = async (deviceId: string, content: NotificationContent) => {
  const message = {
    notification: content.notification,
    token: deviceId,
    apns: {
			payload: {
				aps: {
					'content-available': true,
				},
			},
		},
  };
  admin.messaging().send(message).then(response => functions.logger.debug('notification sent to instructor: ', response))
  .catch(err => functions.logger.debug('err sending notification: ', err));
};
