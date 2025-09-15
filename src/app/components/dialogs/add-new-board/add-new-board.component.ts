import {DialogRef} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, of} from 'rxjs';
import {fadeZoomInOutTrigger} from "../../../animations/fade-zoom-in-out.trigger";
import {BoardCreateData} from '../../../models/board';
import {AuthService} from '../../../services/auth.service';
import {BoardService} from '../../../services/board.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {LoaderComponent} from '../../loader/loader.component';

@Component({
  selector: 'app-add-new-board',
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    LoaderComponent,
    AsyncPipe
  ],
  templateUrl: './add-new-board.component.html',
  styleUrl: './add-new-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class AddNewBoardComponent implements OnInit {

  private readonly _dialogRef = inject(DialogRef<AddNewBoardComponent>);
  private readonly _boardService = inject(BoardService);
  private readonly _authService = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly _isRequesting$ = new BehaviorSubject(false);
  protected readonly _user$ = this._authService.user$;

  protected readonly _form = new FormGroup({
    name: new FormControl('', Validators.required),
    boardStatusesNames: new FormArray<FormControl<string | null>>([])
  });

  ngOnInit() {

    combineLatest([
      this._user$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      user
    ]) => {

      if (!user) {
        this.close();
      }
    });

    combineLatest([
      this._isRequesting$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      isRequesting
    ]) => {

      if (isRequesting) {
        this._form.disable();
      } else {
        this._form.enable();
      }
    });

    this.addNewBoardStatusName();
  }

  boardCreate() {

    if (this._isRequesting$.value) {
      return;
    }

    this._form.updateValueAndValidity();
    this._form.markAllAsTouched();

    if (this._form.invalid) {
      return;
    }

    const createBoardData = {
      name: this._form.value.name,
      boardStatusesNames: this._form.value.boardStatusesNames,
    } as BoardCreateData;

    this._isRequesting$.next(true);

    this._boardService.boardCreate(createBoardData).pipe(
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

  addNewBoardStatusName() {
    this._form.controls.boardStatusesNames.push(new FormControl('', [Validators.required]));
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
