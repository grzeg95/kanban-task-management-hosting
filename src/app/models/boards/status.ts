export type StatusDoc = {
  name: string;
  tasksIdsSequence: string[];
};

export type Status = {
  id: string;
  path: string;
} & StatusDoc;
