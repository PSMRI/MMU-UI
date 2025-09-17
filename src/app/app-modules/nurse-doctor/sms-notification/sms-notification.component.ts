import { Component, Inject, ViewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { SmsTemplateService } from '../smsTemplate/sms-template.service';
import { ConfirmationService } from '../../core/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { map, switchMap } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-sms-notification',
  templateUrl: './sms-notification.component.html',
  styleUrls: ['./sms-notification.component.css'],
})
export class SmsNotificationComponent {
  altNum = false;
  mobileNumber: any;
  smsFlag = false;
  beneficiaryDetails: any;
  beneficiaryRegID: any;
  current_campaign: any;
  currentLanguageSet: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private _smsService: SmsTemplateService,
    private alertMessage: ConfirmationService,
    public dialogRef: MatDialogRef<SmsNotificationComponent>,
    public httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  displayedColumns: string[] = [
    'prescriptionID',
    'diagnosisProvided',
    'drug',
    'strength',
    'frequency',
    'noOfDays',
    'remarks',
  ];

  dataSource!: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.data.prescribedDrugs);
    console.log('SMS object:', this.data);

    this.assignSelectedLanguage();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  validNumber: any = false;

  mobileNum(value: any) {
    if (value.length == 10) {
      this.validNumber = true;
    } else {
      this.validNumber = false;
    }
  }

  sendSMS() {
    const currentServiceID = this.sessionstorage.getItem('currentServiceID');
    // const currentServiceID = 3; // For testing purpose, replace with actual value
    if (currentServiceID != undefined) {
      this._smsService
        .getSMStypes(currentServiceID)
        .pipe(
          map(
            (res: any) =>
              res?.data?.find((t: any) => t.smsType === 'MMUPrescription SMS')
                ?.smsTypeID
          ),
          // pipe(
          // map(Prescription SMS
          //   (res: any) =>
          //     res?.data?.find((t: any) => t.smsType === 'Prescription SMS'')
          //       ?.smsTypeID
          // ),
          switchMap((smsTypeID: string | null) => {
            if (!smsTypeID) throw new Error('Prescription SMS type not found');
            return this._smsService
              .getSMStemplates(
                // 1,
                this.sessionstorage.getItem('providerServiceMapID'),
                // 18,
                // 173,
                smsTypeID
              )
              .pipe(
                map((res: any) => ({
                  smsTemplateID: res?.data?.find((tpl: any) => !tpl.deleted)
                    ?.smsTemplateID,
                  smsTemplateTypeID: smsTypeID,
                }))
              );
          }),
          switchMap(({ smsTemplateID, smsTemplateTypeID }) => {
            if (!smsTemplateID) throw new Error('Valid SMS template not found');
            const req_arr = [];
            for (let i = 0; i < this.data.prescribedDrugs.length; i++) {
              console.log('this.data[i]', this.data[i]);

              // const Obj = {
              //   alternateNo: this.mobileNumber,
              //   // beneficiaryRegID: '12234',
              //   createdBy: this.sessionstorage.getItem('userName'),
              //   is1097: false,
              //   providerServiceMapID:
              //     this.sessionstorage.getItem('providerServiceID'),
              //   smsTemplateID: smsTemplateID,
              //   smsTemplateTypeID: smsTemplateTypeID,
              //   ...this.data.prescribedDrugs[i],
              // };

              const Obj = {
                alternateNo: this.mobileNumber,
                beneficiaryRegID: this.beneficiaryRegID,
                prescribedDrugID: this.data.prescribedDrugs[i].prescribedDrugID,
                createdBy: this.sessionstorage.getItem('userName'),
                is1097: false,
                providerServiceMapID:
                  this.sessionstorage.getItem('providerServiceID'),
                smsTemplateID: smsTemplateID,
                smsTemplateTypeID: smsTemplateTypeID,
              };

              req_arr.push(Obj);
              console.log('Obj', Obj);
            }
            console.log('req_arr', req_arr);

            return this._smsService.sendSMS(req_arr);
          })
        )
        .subscribe({
          next: () => {
            this.snackBar.open('SMS sent successfully', 'Close', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['snackbar-success'],
            });
          },
          error: err => {
            console.error('Error sending SMS:', err);
            this.snackBar.open('SMS not sent', 'Close', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['snackbar-error'],
            });
          },
        });

      this.dialogRef.close();
    }
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    console.log('charCode', charCode);

    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onClose(): void {
    this.dialogRef.close(); // closes the dialog
  }
}
