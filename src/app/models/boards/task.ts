export type TaskDoc = {
  title: string;
  statusesIdsSequence: string[];
};

export type Task = {
  id: string;
  path: string;
} & TaskDoc;

export type CreateTaskData = {
  boardId: string;
  boardStatusId: string;
  title: string;
  description: string;
  subtasks: string[];
};

export type CreateTaskResult = {
  id: string;
  tasksIdsSequence: string[];
  subtasksIdsSequence: string[];
};

export type UpdateTaskData = {
  id: string;
  boardId: string;
  boardStatusId: string;
  title: string;
  description: string;
  subtasks: {
    id?: string;
    title: string;
  }[];
};

export type UpdateTaskResult = {
  id: string;
  subtasksIdsSequence: string[];
};

export type DeleteTaskData = {
  id: string;
  boardId: string;
  boardStatusId: string;
};

export type DeleteTaskResult = undefined;
