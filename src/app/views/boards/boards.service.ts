import {Injectable, signal} from '@angular/core';
import {QuerySnapshot} from '@angular/fire/firestore';
import {BoardDoc} from '../../models/boards/board';
import {Status} from '../../models/boards/status';
import {Subtask} from '../../models/boards/subtask';
import {Task} from '../../models/boards/task';

@Injectable()
export class BoardsService {

  readonly boards = signal<undefined | QuerySnapshot<BoardDoc>>(undefined);
  readonly statuses = signal<Status[] | undefined>(undefined);
  readonly statusPathTasks = signal<Map<string, Task[]> | undefined>(undefined);
  readonly taskPathSubtasks = signal<Map<string, Subtask[]> | undefined>(undefined);
}
