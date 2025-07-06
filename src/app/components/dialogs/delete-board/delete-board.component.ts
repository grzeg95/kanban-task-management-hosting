import {DialogRef} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, of} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../../animations/fade-zoom-in-out.trigger';
import {BoardService} from '../../../services/board.service';
import {ButtonComponent} from '../../button/button.component';
import {LoaderComponent} from '../../loader/loader.component';

@Component({
  selector: 'app-delete-board',
  standalone: true,
  imports: [
    ButtonComponent,
    ReactiveFormsModule,
    LoaderComponent,
    AsyncPipe
  ],
  templateUrl: './delete-board.component.html',
  styleUrl: './delete-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class DeleteBoardComponent implements OnInit {

  protected readonly _isRequesting$ = new BehaviorSubject(false);
  protected readonly _board$ = this._boardService.board$;

  constructor(
    private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    private readonly _boardService: BoardService,
    private readonly _destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {

    combineLatest([
      this._board$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(([
      board
    ]) => {

      if (!board && board !== undefined) {
        this.close();
      }

    })
  }

  boardDelete() {

    const board = this._board$.value;

    if (this._isRequesting$.value || !board) {
      return;
    }

    this._isRequesting$.next(true);

    this._boardService.boardDelete({id: board.id}).pipe(
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
}
