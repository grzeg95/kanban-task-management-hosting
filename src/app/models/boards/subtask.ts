export type SubtaskDoc = {
  name: string;
  isCompleted: boolean;
};

export type Subtask = {
  id: string;
  path: string;
} & SubtaskDoc;
