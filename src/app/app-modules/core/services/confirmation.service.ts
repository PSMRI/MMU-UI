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

  public confirm(
    title: string,
    message: string,
    btnOkText = 'OK',
    btnCancelText = 'Cancel'
  ): Observable<boolean> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = true;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
    dialogRef.disableClose = true;

    return dialogRef.afterClosed();
  }

  public confirmHealthId(
    title: string,
    message: string,
    btnOkText = 'OK'
  ): Observable<boolean> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.confirmHealthID = true;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
    dialogRef.disableClose = true;

    return dialogRef.afterClosed();
  }

  public alert(
    message: string,
    status = 'info',
    btnOkText = 'OK'
  ): ZardDialogRef<CommonDialogComponent> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.status = status.toLowerCase();
    instance.btnOkText = btnOkText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = true;
    instance.remarks = false;
    instance.editRemarks = false;

    return dialogRef;
  }

  public remarks(
    message: string,
    titleAlign = 'center',
    messageAlign = 'center',
    btnOkText = 'Submit',
    btnCancelText = 'Cancel'
  ): Observable<any> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = true;
    instance.editRemarks = false;
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
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '60%',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
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
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
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
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
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
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
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
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
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
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.message = message;
    instance.status = status;
    instance.btnOkText = btnOkText;
    instance.confirmAlert = false;
    instance.alertFetsenseMessage = true;
    instance.remarks = false;
    instance.editRemarks = false;
  }
  /*END*/
  public confirmCalibration(
    title: string,
    message: string,
    btnOkText = 'Yes',
    btnCancelText = 'No'
  ): Observable<boolean> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = false;
    instance.confirmcalibration = true;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;

    return dialogRef.afterClosed();
  }
  public confirmCBAC(
    title: string,
    message: string,
    data: any,
    btnOkText = 'OK',
    btnCancelText = 'Cancel'
  ): Observable<boolean> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: true,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = false;
    instance.confirmCBAC = true;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
    instance.cbacData = data;

    return dialogRef.afterClosed();
  }

  public confirmCareContext(
    title: string,
    message: string,
    btnOkText = 'Yes',
    btnCancelText = 'No'
  ): Observable<boolean> {
    const dialogRef = this.dialog.create<CommonDialogComponent, unknown>({
      zContent: CommonDialogComponent,
      zWidth: '420px',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
    });
    const instance = dialogRef.componentInstance!;
    instance.title = title;
    instance.message = message;
    instance.btnOkText = btnOkText;
    instance.btnCancelText = btnCancelText;
    instance.confirmAlert = false;
    instance.confirmCareContext = true;
    instance.confirmCBAC = false;
    instance.confirmcalibration = false;
    instance.alert = false;
    instance.remarks = false;
    instance.editRemarks = false;
    dialogRef.disableClose = true;

    return dialogRef.afterClosed();
  }
}
