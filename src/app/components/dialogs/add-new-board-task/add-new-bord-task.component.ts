import {DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, of} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
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
import {fadeZoomInOutTrigger} from "../../../animations/fade-zoom-in-out.trigger";
import {Sig} from "../../../utils/Sig";

@Component({
  selector: 'app-view-board-task',
  standalone: true,
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    SvgDirective,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    TextareaComponent,
    SelectComponent,
    LoaderComponent
  ],
  templateUrl: './add-new-bord-task.component.html',
  styleUrl: './add-new-bord-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class AddNewBordTaskComponent {

  protected readonly _isRequesting = signal(false);
  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatuses = this._boardService.boardStatusesSig.get();

  protected readonly _boardStatusesPopMenuItems = computed<PopMenuItem[]>(() => {

    const board = this._board();
    const boardStatuses = this._boardStatuses();

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
  });

  private readonly _viewIsReadyToShowSig = new Sig(2);
  protected readonly _viewIsReadyToShow = this._viewIsReadyToShowSig.get();

  protected readonly form = new FormGroup({
    boardId: new FormControl('', Validators.required),
    boardStatusId: new FormControl('', Validators.required),
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    boardTaskSubtasksTitles: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<AddNewBordTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this._board();
      const boardStatuses = this._boardStatuses();

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

      this._viewIsReadyToShowSig.update((val) => (val || 1) - 1);
    });

    effect(() => {

      const boardStatusesPopMenuItems = this._boardStatusesPopMenuItems();

      setTimeout(() => {
        if (
          !boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => this.form.controls.boardStatusId.value === boardStatusesPopMenuItem.value) ||
          !this.form.controls.boardStatusId.value
        ) {
          this.form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
        }

        this._viewIsReadyToShowSig.update((val) => (val || 1) - 1);
      });
    });

    effect(() => {

      if (this._isRequesting()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });

    this.addNewSubtask();
  }

  boardTaskCreate() {

    if (this._isRequesting()) {
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

    this._isRequesting.set(true);

    this._boardService.boardTaskCreate(createTaskData).pipe(
      catchError(() => {

        this._isRequesting.set(false);
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
