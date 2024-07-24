import {DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTaskCreateData} from '../../../models/board-task';
import {BoardService} from '../../../services/board/board.service';
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
  host: {
    class: 'app-view-board-task'
  }
})
export class AddNewBordTaskComponent {

  protected isDone = signal(false);
  protected isRequesting = signal(false);
  protected board = this._boardService.board;
  protected boardStatuses = this._boardService.boardStatuses;

  protected boardStatusesPopMenuItems = computed<PopMenuItem[]>(() => {

    const board = this.board();
    const boardStatuses = this.boardStatuses();

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

  protected form = new FormGroup({
    boardId: new FormControl(''),
    boardStatusId: new FormControl(''),
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    boardTaskSubtasksTitles: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<AddNewBordTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this.board();
      const boardStatuses = this.boardStatuses();

      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }

      if (board === undefined || boardStatuses === undefined) {
        return;
      }

      this.form.controls.boardId.setValue(board.id);
    });

    effect(() => {

      const boardStatusesPopMenuItems = this.boardStatusesPopMenuItems();

      setTimeout(() => {
        if (
          !boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => this.form.controls.boardStatusId.value === boardStatusesPopMenuItem.value) ||
          !this.form.controls.boardStatusId.value
        ) {
          this.form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
        }
      });
    });

    effect(() => {

      if (this.isDone()) {
        this.close();
      }
    });

    effect(() => {

      if (this.isRequesting()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });

    effect(() => {

      if (!this.isRequesting()) {
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

      this._boardService.boardTaskCreate(createTaskData).pipe(
        catchError(() => {
          this.isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this.isDone.set(true);
        this.isRequesting.set(false);
      });
    }, {allowSignalWrites: true});

    this.addNewSubtask();
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
