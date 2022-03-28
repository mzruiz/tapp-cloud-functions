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
  const body = 'Tap here to see learn more.';
  return createNotificationContent(title, body);
};
