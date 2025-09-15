import {DialogRef} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, of} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../../animations/fade-zoom-in-out.trigger';
import {BoardService} from '../../../services/board.service';
import {ButtonComponent} from '../../button/button.component';
import {LoaderComponent} from '../../loader/loader.component';

@Component({
  selector: 'app-delete-board-task',
  imports: [
    ButtonComponent,
    ReactiveFormsModule,
    LoaderComponent,
    AsyncPipe
  ],
  templateUrl: './delete-board-task.component.html',
  styleUrl: './delete-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class DeleteBoardTaskComponent implements OnInit, OnDestroy {

  private readonly _boardService = inject(BoardService);
  private readonly _dialogRef = inject(DialogRef<DeleteBoardTaskComponent>)
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly _isRequesting$ = new BehaviorSubject(false);
  protected readonly _board$ = this._boardService.board$;
  protected readonly _boardTask$ = this._boardService.boardTask$;

  ngOnInit() {

    combineLatest([
      this._board$,
      this._boardTask$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      board,
      boardTask
    ]) => {

      if (!board && board !== undefined) {
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      if (!boardTask && boardTask !== undefined) {
        this.close();
      }
    });
  }

  boardTaskDelete() {

    if (this._isRequesting$.value) {
      return;
    }

    const board = this._board$.value;
    const boardTask = this._boardTask$.value;

    if (!board || !boardTask) {
      return;
    }

    this._isRequesting$.next(true);

    this._boardService.boardTaskDelete({
      id: boardTask.id,
      boardId: board.id
    }).pipe(
      catchError(() => {

        this._isRequesting$.next(false);
        return of(null);
      })
    ).subscribe((result) => {

      if (result) {
        this.close();
      }
    });
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }

  ngOnDestroy(): void {
    this._boardService.boardTaskId$.next(null);
  }
}
