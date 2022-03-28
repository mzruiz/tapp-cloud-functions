export type NotificationInstruction = {
  recipients: string[]; // The ids for each user
  content: NotificationContent;
};

export type NotificationContent = {
  notification: {
    title: string;
    body: string;
  };
};

export type FCMTokenDoc = {
  token: string;
};
