import {Dialog, DialogRef} from '@angular/cdk/dialog';
import {Overlay} from '@angular/cdk/overlay';
import {Injectable} from '@angular/core';
import {SnackBarComponent} from '../components/snack-bar/snack-bar.component';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  private _dialogRef: DialogRef<unknown, SnackBarComponent> | undefined;

  constructor(
    private readonly _overlay: Overlay,
    private readonly _dialog: Dialog,
  ) {
  }

  open(message: string, duration?: number): void {

    if (this._dialogRef) {
      this._dialogRef.overlayRef.detach();
    }

    this._dialogRef = this._dialog.open(SnackBarComponent, {
      positionStrategy: this._overlay.position().global().centerHorizontally().bottom(),
      hasBackdrop: false,
      data: {
        message
      }
    });

    if (duration && duration > 0) {
      setTimeout(() => {
        this._dialogRef?.overlayRef.detach();
      }, duration);
    }
  }
}
