import {Task} from './task';

export type Status = {
  id: string;
  name: string;
  tasksIdsSequence: string[];
  tasks: {[key in string]: Task};
};
