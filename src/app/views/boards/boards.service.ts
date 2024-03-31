import {DestroyRef, Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, combineLatest, map, Subscription} from 'rxjs';
import {AppService} from '../../services/app.service';
import {AuthService} from '../../services/auth/auth.service';
import {FirestoreService} from '../../services/firebase/firestore.service';
import {Board, BoardDoc} from './models/board';

@Injectable()
export class BoardsService {

  private _boardSub: Subscription | undefined;
  private readonly _lastBoardId: string | undefined;
  readonly boardId$ = new BehaviorSubject<string | undefined>(undefined);
  readonly board$ = new BehaviorSubject<Board | undefined>(undefined);

  constructor(
    private readonly _router: Router,
    private readonly _appService: AppService,
    private readonly _authService: AuthService,
    private readonly _firestoreService: FirestoreService,
  ) {
    this._authService.user$.pipe(
      takeUntilDestroyed()
    ).subscribe((user) => {

      const list = user ? user.boards.map((board) => ({label: board.name, id: board.id})) : null;

      this._appService.list$.next(cloneDeep(list));
    });
  }

  runSelectingOfBoard(activatedRoute: ActivatedRoute, destroyRef: DestroyRef) {

    combineLatest([
      this.boardId$,
      this._authService.user$
    ]).pipe(
      takeUntilDestroyed(destroyRef)
    ).subscribe(([boardId, user]) => {

      if (!user) {
        return;
      }

      const board = user && user.boards.find((board) => board.id === boardId);

      if (!board) {
        this._router.navigate(['../'], {relativeTo: activatedRoute});
        this._appService.select('');
        return;
      }

      if (!boardId) {
        return;
      }

      if (this._lastBoardId !== boardId) {

        this._appService.select(boardId);

        if (this._boardSub && !this._boardSub.closed) {
          this._boardSub.unsubscribe();
        }

        this._boardSub = this._firestoreService.docOnSnapshot<BoardDoc>(`/users/${user.id}/boards/${board.id}`).pipe(
          map((boardDocSnap) => {

            const board: Board = {
              ...boardDocSnap.data()!,
              id: boardDocSnap.id
            };

            return board;
          })
        ).subscribe((board) => this.board$.next(cloneDeep(board)));
      }
    });
  }
}
