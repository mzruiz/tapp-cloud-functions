import { NotificationContent } from "./model";

const createNotificationContent = (title: string, body: string): NotificationContent => {
  return {
    notification: {
      title,
      body,
    }
  }
};

/**
 * Sent when someone has been assigned to a Tapp
 */
export const createNewAssignedTappNotification = (sender: string) => {
  const title = `${sender} has invited you to a Tapp.`;
  const body = 'Tap here to learn more.';
  return createNotificationContent(title, body);
};

/**
 * Sent when someone has updated a Tapp
 */
 export const createTappEditNotification = (sender: string) => {
  const title = `${sender} has updated a Tapp`;
  const body = 'Tap here to learn more.';
  return createNotificationContent(title, body);
};

/**
 * Sent when someone has sent a message
 */
 export const createNewMessageNotification = (sender: string, message: string) => {
  const title = `${sender} has sent you a message.`;
  const body = message;
  return createNotificationContent(title, body);
};

/**
 * Video call started
 */
 export const createVideoCallStartedNotification = (sender: string, tappTitle: string) => {
  const title = `${sender} has started a video call`;
  const body = 'Tapp to join the call for ' + tappTitle;
  return createNotificationContent(title, body);
};

/**
 * Collaborator has accepted the Tapp invite
 */
 export const createTappAcceptedNotification = (message: string) => {
  const title = message;
  const body = 'Tapp here to start collaborating';
  return createNotificationContent(title, body);
};

/**
 * Collaborator has rejected the Tapp invite
 */
 export const createTappRejectedNotification = (message: string) => {
  const title = message;
  const body = 'Tapp here to invite someone else!';
  return createNotificationContent(title, body);
};

/**
 * Owner has deleted a Tapp
 */
 export const createTappDeletedNotification = (message: string) => {
  const title = message;
  const body = 'Tapp here to create another Tapp!';
  return createNotificationContent(title, body);
};