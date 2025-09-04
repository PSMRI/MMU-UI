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
    public dialogReff: MatDialogRef<SmsNotificationComponent>,
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

  // Assuming prescriptionData.prescription comes from dialog config or service
  // prescriptionData = {
  //   prescription: [
  //     {
  //       prescriptionID: 'RX001',
  //       diagnosisProvided: 'Cold',
  //       remarks: 'Take rest',
  //       prescribedDrugs: [
  //         { drugName: 'Paracetamol', dosage: '500mg', frequency: '2x/day', noOfDays: 5 }
  //       ]
  //     }
  //   ]
  // };

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.data.prescriptionData);
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

  sendSMS(alternate_Phone_No: any) {
    const currentServiceID = this.sessionstorage.getItem('currentServiceID');
    if (currentServiceID != undefined) {
      this._smsService
        .getSMStypes(currentServiceID)
        .pipe(
          map(
            (res: any) =>
              res?.data?.find((t: any) => t.smsType === 'Prescription SMS')
                ?.smsTypeID
          ),
          switchMap((smsTypeID: string | null) => {
            if (!smsTypeID) throw new Error('Prescription SMS type not found');
            return this._smsService
              .getSMStemplates(
                this.sessionstorage.getItem('providerServiceMapID'),
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
            // let req_arr = [];
            // for (let i = 0; i < this.row_array.length; i++) {
            const Obj = {
              alternateNo: alternate_Phone_No,
              beneficiaryRegID: '12234',
              createdBy: this.sessionstorage.getItem('userName'),
              is1097: false,
              providerServiceMapID:
                this.sessionstorage.getItem('providerServiceID'),
              smsTemplateID: smsTemplateID,
              smsTemplateTypeID: smsTemplateTypeID,
              ...this.data,
            };

            // req_arr.push(Obj);
            // }
            return this._smsService.sendSMS(Obj);
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

      this.dialogReff.close();
    }
  }
}
