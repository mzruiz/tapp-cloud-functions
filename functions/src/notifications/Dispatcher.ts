import { NotificationContent, NotificationInstruction, PayloadData } from "./model";
import admin = require('firebase-admin');
import functions = require('firebase-functions');

export const sendNotifications = (instruction: NotificationInstruction) => {
  const {recipients, content} = instruction;
  // getFCMTokens(recipients);
  recipients.map(recipient => {
    sendNotification(recipient, content, instruction.payload);
  });
};

const sendNotification = async (deviceId: string, content: NotificationContent, data: PayloadData) => {
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
    data,
  };
  admin.messaging().send(message).then(response => {
    functions.logger.debug('Notification sent. Response: ', response);
    functions.logger.debug('Message: ', message);
  }).catch(err => functions.logger.debug('err sending notification: ', err));
};
