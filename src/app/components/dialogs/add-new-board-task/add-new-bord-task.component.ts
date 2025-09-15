import {DialogRef} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, map, of} from 'rxjs';
import {fadeZoomInOutTrigger} from "../../../animations/fade-zoom-in-out.trigger";
import {BoardTaskCreateData} from '../../../models/board-task';
import {BoardService} from '../../../services/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {SelectComponent} from '../../form/select/select.component';
import {TextareaComponent} from '../../form/textarea/textarea.component';
import {LoaderComponent} from '../../loader/loader.component';
import {PopMenuItem} from '../../pop-menu/pop-menu-item/pop-menu-item.model';

@Component({
  selector: 'app-view-board-task',
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    TextareaComponent,
    SelectComponent,
    LoaderComponent,
    AsyncPipe
  ],
  templateUrl: './add-new-bord-task.component.html',
  styleUrl: './add-new-bord-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class AddNewBordTaskComponent implements OnInit {

  private readonly _boardService = inject(BoardService);
  private readonly _dialogRef = inject(DialogRef<AddNewBordTaskComponent>);
  private readonly _snackBarService = inject(SnackBarService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly _isRequesting$ = new BehaviorSubject(false);
  protected readonly _board$ = this._boardService.board$;
  protected readonly _boardStatuses$ = this._boardService.boardStatuses$;

  protected readonly _boardStatusesPopMenuItems$ = combineLatest([
    this._board$,
    this._boardStatuses$
  ]).pipe(
    map(([
      board,
      boardStatuses
    ]) => {
      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        return [];
      }

      if (board === undefined || boardStatuses === undefined) {
        return [];
      }

      return board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((boardStatus) => !!boardStatus).map((boardStatus) => {
        return {
          value: boardStatus!.id,
          label: boardStatus!.name
        } as PopMenuItem;
      });
    })
  );

  protected readonly form = new FormGroup({
    boardId: new FormControl('', Validators.required),
    boardStatusId: new FormControl('', Validators.required),
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    boardTaskSubtasksTitles: new FormArray<FormControl<string | null>>([])
  });

  ngOnInit() {

    combineLatest([
      this._board$,
      this._boardStatuses$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(([
      board,
      boardStatuses
    ]) => {

      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        this._snackBarService.open(`This board wasn't found`, 3000);
        this.close();
        return;
      }

      if (board === undefined || boardStatuses === undefined) {
        return;
      }

      this.form.controls.boardId.setValue(board.id);
    });

    combineLatest([
      this._boardStatusesPopMenuItems$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(([
      boardStatusesPopMenuItems
    ]) => {

      setTimeout(() => {
        if (
          !boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => this.form.controls.boardStatusId.value === boardStatusesPopMenuItem.value) ||
          !this.form.controls.boardStatusId.value
        ) {
          this.form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
        }
      });
    });

    combineLatest([
      this._isRequesting$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(([
      isRequesting
    ]) => {
      if (isRequesting) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    })

    this.addNewSubtask();
  }

  boardTaskCreate() {

    if (this._isRequesting$.value) {
      return;
    }

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const createTaskData = {
      boardId: this.form.value.boardId,
      boardStatusId: this.form.value.boardStatusId,
      title: this.form.value.title,
      description: this.form.value.description,
      boardTaskSubtasksTitles: this.form.value.boardTaskSubtasksTitles,
    } as BoardTaskCreateData;

    this._isRequesting$.next(true);

    this._boardService.boardTaskCreate(createTaskData).pipe(
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

  addNewSubtask() {
    this.form.controls.boardTaskSubtasksTitles.push(new FormControl('', [Validators.required]));
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
