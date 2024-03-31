import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {ChangeDetectionStrategy, Component, DestroyRef, Signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs';
import {ButtonComponent} from '../../../components/button/button.component';
import {LayoutService} from '../../../services/layout.service';
import {getProtectedRxjsPipe} from '../../../utils/get-protected.rxjs-pipe';
import {BoardsService} from '../boards.service';
import {EditBoardComponent} from '../dialogs/edit-board/edit-board.component';
import {Board} from '../models/board';
import {Task} from '../models/task';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgStyle,
    ButtonComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-board'
  }
})
export class BoardComponent {

  protected statusesIndicators = ['#49C4E5', '#8471F2', '#67E2AE'];

  protected board = toSignal(this._boardsService.board$.pipe(getProtectedRxjsPipe()));
  protected heightNav = toSignal(this._layoutService.heightNav$);

  constructor(
    private readonly _boardsService: BoardsService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    _destroyRef: DestroyRef
  ) {

    this._boardsService.runSelectingOfBoard(this._activatedRoute, _destroyRef);

    this._activatedRoute.params.pipe(
      map((params) => params['id'])
    ).subscribe((id) => {
      this._boardsService.boardId$.next(id);
    });
  }

  getCompletedSubtasks(statusId: string, taskId: string, subtasksIdsSequence: string[]) {

    const board = this.board();

    if (!board) {
      return 0;
    }

    return subtasksIdsSequence.reduce((cnt, subtaskId) => cnt + +board.statuses[statusId].tasks[taskId].subtasks[subtaskId].isCompleted, 0) || 0;
  }

  openTaskDialog($event: KeyboardEvent | MouseEvent, task: Task) {
    $event.preventDefault();
    $event.stopPropagation();
  }

  openNewStatusDialog($event: KeyboardEvent | MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }

  openEditBoardDialog($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }
}
