import {InjectionToken} from '@angular/core';

export type KanbanConfig = {
  maxUserBoards: number;
  maxBoardStatuses: number;
  maxBoardTasks: number;
  maxBoardTaskSubtasks: number;
};

export const KanbanConfig = new InjectionToken<KanbanConfig>('KanbanConfig');
