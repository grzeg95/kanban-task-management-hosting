import {InjectionToken} from '@angular/core';

export type KanbanConfig = {
  maxBoardUser: number;
  maxBoardStatuses: number;
  maxBoardTasks: number;
  maxBoardTaskSubtasks: number;
};

export const KanbanConfig = new InjectionToken<KanbanConfig>('KanbnConfig');
