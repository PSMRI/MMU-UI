import { Injectable, ViewContainerRef, Inject, DOCUMENT } from '@angular/core';
import { ZardDialogService, ZardDialogRef } from 'Common-UI/v2/ui/dialog';

import { Observable } from 'rxjs';
import { CommonDialogComponent } from '../components/common-dialog/common-dialog.component';

@Injectable()
export class ConfirmationService {
  constructor(
    public dialog: ZardDialogService,
    @Inject(DOCUMENT) doc: any
  ) {}

  private createDialog(
    zWidth: string,
    zMaskClosable: boolean
  ): ZardDialogRef<CommonDialogComponent> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth,
      zMaskClosable,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
    return dialogRef;
  }

  public confirm(
    title: string,
    message: string,
    btnOkText = 'OK',
    btnCancelText = 'Cancel'
  ): Observable<boolean> {
    const dialogRef = this.createDialog('420px', false);
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = true;
    dialogRef.disableClose = true;

    return dialogRef.afterClosed();
  }

  public confirmHealthId(
    title: string,
    message: string,
    btnOkText = 'OK'
  ): Observable<boolean> {
    const dialogRef = this.createDialog('420px', false);
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.confirmHealthID = true;
    dialogRef.disableClose = true;

    return dialogRef.afterClosed();
  }

  public alert(
    message: string,
    status = 'info',
    btnOkText = 'OK'
  ): ZardDialogRef<CommonDialogComponent> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.status = status.toLowerCase();
    instance.btnOkText = btnOkText;
    instance.alert = true;

    return dialogRef;
  }

  public remarks(
    message: string,
    titleAlign = 'center',
    messageAlign = 'center',
    btnOkText = 'Submit',
    btnCancelText = 'Cancel'
  ): Observable<any> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.remarks = true;
    instance.btnCancelText = btnCancelText;

    return dialogRef.afterClosed();
  }

  public editRemarks(
    message: string,
    comments: string,
    titleAlign = 'center',
    messageAlign = 'center',
    btnOkText = 'Submit',
    btnCancelText = 'Cancel'
  ): Observable<any> {
    const dialogRef = this.createDialog('60%', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.editRemarks = true;
    instance.comments = comments;
    instance.btnCancelText = btnCancelText;

    return dialogRef.afterClosed();
  }

  public notify(
    message: string,
    mandatories: any,
    titleAlign = 'center',
    messageAlign = 'center',
    btnOkText = 'OK'
  ): Observable<any> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.notify = true;
    instance.mandatories = mandatories;
    return dialogRef.afterClosed();
  }

  public choice(
    message: string,
    values: any,
    titleAlign = 'center',
    messageAlign = 'center',
    btnOkText = 'Confirm',
    btnCancelText = 'Cancel'
  ): Observable<any> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.notify = false;
    instance.choice = true;
    instance.values = values;
    return dialogRef.afterClosed();
  }

  public startTimer(
    title: string,
    message: string,
    timer: number,
    btnOkText = 'Continue',
    btnCancelText = 'Cancel'
  ): Observable<any> {
    const dialogRef = this.createDialog('420px', false);
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.sessionTimeout = true;
    instance.updateTimer(timer);

    return dialogRef.afterClosed();
  }

  public choiceSelect(
    message: string,
    values: any,
    titleAlign = 'center',
    messageAlign = 'center',
    btnOkText = 'Proceed',
    btnCancelText = 'Cancel'
  ): Observable<any> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.notify = false;
    instance.choice = false;
    instance.choiceSelect = true;
    instance.values = values;
    return dialogRef.afterClosed();
  }

  /**
   * (C)
   * DE40034072
   *25-06-21
   */

  /*Visit Category - ANC
     Gender - Female
    For displaying fetosense test status
    */
  public alertFetsenseMessage(
    message: string,
    status = 'Fetosense Device',
    btnOkText = 'OK'
  ): void {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.status = status;
    instance.btnOkText = btnOkText;
    instance.alertFetsenseMessage = true;
  }
  /*END*/
  public confirmCalibration(
    title: string,
    message: string,
    btnOkText = 'Yes',
    btnCancelText = 'No'
  ): Observable<boolean> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmcalibration = true;

    return dialogRef.afterClosed();
  }
  public confirmCBAC(
    title: string,
    message: string,
    data: any,
    btnOkText = 'OK',
    btnCancelText = 'Cancel'
  ): Observable<boolean> {
    const dialogRef = this.createDialog('420px', true);
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmCBAC = true;
    instance.cbacData = data;

    return dialogRef.afterClosed();
  }

  public confirmCareContext(
    title: string,
    message: string,
    btnOkText = 'Yes',
    btnCancelText = 'No'
  ): Observable<boolean> {
    const dialogRef = this.createDialog('420px', false);
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmCareContext = true;
    instance.confirmCBAC = false;
    dialogRef.disableClose = true;

    return dialogRef.afterClosed();
  }
}
