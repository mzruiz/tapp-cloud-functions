export type User = {
  id: string;
  phone: string; // id
  firstName: string;
  lastName: string;
  image: string;
  invitedBy?: string; // id of the User
  isHomeFirstFinished: boolean; // shows a modal the first time a user uses the app, initially true then will be false once viewed - https://www.loom.com/share/7f710a6554a14c639d424c916d8cf67d
  fcmToken: string;
};

export type Contact = {
  id: string;
  phone: string; // id
  firstName: string;
  lastName: string;
  image: string;
  user: string; // The id of the User who created the Contact
};

/**
 * Contains the list of users that can collaborate on a Task
 */
export type TaskGroup = {
  id: string;
  name: string; // The name of the group (Home, School, Family, etc.)
  image: string;
  users: string[]; // list of User ids
  userNames: Contact[];
};
export type Task = {
  id: string;
  createdDate: number; // Date.now()
  title: string;
  description: string;
  taskDueDate: number; // Milliseconds and not the number of minutes/hours 12/21/2022 9:00 AM EST
  subtasks: string[]; // subtask id
  status: TASK_STATUS;
  createdBy: string; // id of User
  collaborators: string[]; // list of TaskAssignee ids
  owner: string; // the User in charge
  messageThread: string; // MessageThread id
};
export type Subtask = {
  id: string;
  task: string; // id of parent task
  description: string;
  collaborators: string[]; // TaskAssignee ids
  isComplete: boolean;
  messageThread: string; // MessageThread id
};

/**
 * The entity that was given access to a Task
 */
export type TaskAssignee = {
  id: string; // id of User
  task: string; // id of the Task
  dateInvited: number; // Date.now() when the invite was sent
  invitedBy: string;
  assigneeType: ASSIGNEE_TYPE; // determines if we should view assignedUser or assignedGroup
};
export enum ASSIGNEE_TYPE {
  INDIVIDUAL,
  GROUP,
}
export type UserAssignee = TaskAssignee & {
  contactId: string;
  status: INVITE_STATUS;
  dateOfResponse: number;
  rejectionReason?: string;
};
export type GroupAssignee = TaskAssignee & {
  group: string; // id of of the TaskGroup
};
export enum TASK_STATUS {
  TO_DO,
  IN_PROGRESS,
  COMPLETED,
}
export enum INVITE_STATUS {
  PENDING_INVITE,
  ACCEPTED,
  REJECTED,
}
export type MessageThread = {
  id: string; // id of the Task
  messages: IMessage[];
};
export type IMessage = {
  id: string;
  createdAt: number;
  text: string;
  user: {
    id: string; // id of User
    avatar: string; // user image
  };
  type: CHAT_EVENT_TYPE;
};

export type Notification = {
  id: string;
  createdAt: number;
  type: NOTIFICATION_TYPE;
  message: string;
  task: string;
};

export enum NOTIFICATION_TYPE {
  ADDED_AS_CONTACT,
  TAPP_COMPLETED,
  TAPP_UPDATED,
  ASSIGNED_TAPP,
  NEW_TAPP_MESSAGE,
  ACCEPTED_TAPP,
  REJECTED_TAPP,
  DELETED_TAPP,
}

export enum TAPP_TYPE {
  ASSIGNED_TO_ME,
  ASSIGNED_TO_MYSELF,
  ASSIGNED_TO_OTHERS,
}

export enum CHAT_THREAD_STATUS {
  REQUESTED,
  ACTIVE,
  CLOSED,
}

export type Chat = {
  id: string;
  status: CHAT_THREAD_STATUS;
  patient: string;
  doctor: string;
  thread: ChatMessage[];
};

export enum CHAT_EVENT_TYPE {
  MESSAGE,
  VIDEO,
  PHOTO,
}

export type ChatMessage = {
  type: CHAT_EVENT_TYPE;
  createdAt: number;
  text: string;
  user: {
    id: string;
    avatar: string;
  };
  hasBeenRead: boolean;
};

export enum MEDIA_TYPE {
  PHOTO,
  VIDEO,
}

export type UserNotification = {
  id: string;
  user: string;
  hasBeenRead: boolean;
  createdDate: number;
  type: NOTIFICATION_TYPE;
  task: string;
  message: string;
  isSubtask?: boolean;
  subtaskId?: string;
};
export type TwilioConference = {
  id: string;
  tapp: string;
  createdAt: number;
  isStale: boolean;
};