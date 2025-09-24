/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DataSyncService } from './../shared/service/data-sync.service';
import { DataSyncUtils } from '../shared/utility/data-sync-utility';
import { CanComponentDeactivate } from '../../core/services/can-deactivate-guard.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.css'],
})
export class WorkareaComponent
  implements OnInit, CanComponentDeactivate, DoCheck, OnDestroy
{
  generateBenIDForm!: FormGroup;
  current_language_set: any;
  blankTable: any[] = [];
  showTable = false;
  displaySyncBool = true;

  constructor(
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private dataSyncService: DataSyncService,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  syncTableGroupList: any = [];
  benID_Count: any;

  ngOnInit() {
    this.assignSelectedLanguage();
    if (
      this.sessionstorage.getItem('serverKey') !== null ||
      this.sessionstorage.getItem('serverKey') !== undefined
    ) {
      this.getDataSYNCGroup();
    } else {
      this.router.navigate(['datasync/sync-login']);
    }
    this.generateBenIDForm = new DataSyncUtils(this.fb).createBenIDForm();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
  ngOnDestroy() {
    sessionStorage.removeItem('serverKey');
  }

  getDataSYNCGroup() {
    this.dataSyncService.getDataSYNCGroup().subscribe((res: any) => {
      console.clear();
      console.log(res);
      if (res.statusCode === 200) {
        this.syncTableGroupList = this.createSyncActivity(res.data);
        console.log('syncTableGroupList', this.syncTableGroupList);
      }
    });
  }

  createSyncActivity(data: any) {
    data.forEach((element: any) => {
      element.benDetailSynced = false;
      element.visitSynced = false;
    });
    return data;
  }

  showProgressBar = false;
  progressValue = 0;
  failedMasterList: any;
  intervalref: any;

  syncDownloadData() {
    this.failedMasterList = undefined;
    this.progressValue = 0;
    this.confirmationService
      .confirm('info', 'Confirm to download data')
      .subscribe(result => {
        if (result) {
          const serviceLineDetails: any =
            this.sessionstorage.getItem('serviceLineDetails');
          const vanID = JSON.parse(serviceLineDetails).vanID;
          const reqObj = {
            vanID: vanID,
            providerServiceMapID: this.sessionstorage.getItem(
              'dataSyncProviderServiceMapID'
            ),
          };
          this.dataSyncService
            .syncDownloadData(reqObj)
            .subscribe((res: any) => {
              if (res.statusCode === 200) {
                this.showProgressBar = true;
                this.intervalref = setInterval(() => {
                  this.syncDownloadProgressStatus();
                }, 2000);
              } else {
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            });
        }
      });
  }

  // syncGroups() {
  //   this.dataSyncService.syncAllGroups().subscribe(
  //     (res: any) => {
  //       console.log(res);
  //       if (res.statusCode === 200) {
  //         // Update status for each group based on the response
  //         this.updateGroupStatus(res.data.groupsProgress);
  //         this.confirmationService.alert(res.data.response, 'success');
  //       } else {
  //         this.confirmationService.alert(res.errorMessage, 'error');
  //       }
  //     },
  //     err => {
  //       this.confirmationService.alert(err, 'error');
  //     }
  //   );
  // }

  // updateGroupStatus(groupsProgress: any[]) {
  //   // Update status for each group based on the response
  //   this.syncTableGroupList.forEach((group: any) => {
  //     const progress = groupsProgress.find((item: any) => item.groupId === group.syncTableGroupID);
  //     if (progress) {
  //       if (progress.status === 'completed') {
  //         group.status = 'success';
  //       } else if (progress.status === 'failed') {
  //         group.status = 'failed';
  //       }
  //     } else {
  //       group.status = 'pending';
  //     }
  //   });
  // }
  // syncGroups() {
  //   this.dataSyncService.syncAllGroups().subscribe(
  //     (res: any) => {
  //       console.log(res);
  //       if (res.statusCode === 200) {
  //         if (res.data.groupsProgress) {
  //           this.updateGroupStatus(res.data.groupsProgress);
  //         }
  //         this.confirmationService.alert(res.data.response, 'success');
  //       } else {
  //         this.confirmationService.alert(res.data.response, 'error');
  //         if (res.data.groupsProgress) {
  //           this.updateGroupStatus(res.data.groupsProgress);
  //         }
  //       }
  //       this.showTable = true;
  //     },
  //     err => {
  //       this.confirmationService.alert(
  //         err.message || 'An error occurred',
  //         'error'
  //       );
  //     }
  //   );
  // }

  // updateGroupStatus(groupsProgress: any[]) {
  //   this.syncTableGroupList.forEach((group: any) => {
  //     const progress = groupsProgress.find(
  //       (item: any) => item.groupId === group.syncTableGroupID
  //     );
  //     if (progress) {
  //       if (progress.status === 'completed') {
  //         group.status = 'success';
  //       } else if (progress.status === 'failed') {
  //         group.status = 'failed';
  //       } else {
  //         group.status = 'pending';
  //       }
  //     } else {
  //       group.status = 'pending';
  //     }
  //   });
  // }
  syncGroups() {
    this.dataSyncService.syncAllGroups().subscribe(
      (res: any) => {
        console.log(res);
        if (res.statusCode === 200) {
          if (res.data.groupsProgress) {
            this.updateGroupStatus(res.data.groupsProgress);
          }
          this.confirmationService.alert(res.data.response, 'success');
        } else {
          this.confirmationService.alert(res.data.response, 'error');
          if (res.data.groupsProgress) {
            this.updateGroupStatus(res.data.groupsProgress);
          }
        }
        this.showTable = true;
        this.displaySyncBool = false;
      },
      err => {
        this.confirmationService.alert(
          err.message || 'An error occurred',
          'error'
        );
      }
    );
  }
  updateGroupStatus(groupsProgress: any[]) {
    this.syncTableGroupList.forEach((group: any) => {
      const progress = groupsProgress.find(
        (item: any) => item.groupId === group.syncTableGroupID
      );

      if (progress) {
        if (progress.status === 'completed') {
          group.status = 'success';
        } else if (progress.status === 'failed') {
          group.status = 'failed';
        } else {
          group.status = 'pending';
        }
      } else {
        group.status = 'pending';
      }
    });
  }

  syncDownloadProgressStatus() {
    this.dataSyncService.syncDownloadDataProgress().subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.progressValue = res.data.percentage;

        if (this.progressValue >= 100) {
          this.failedMasterList = res.data.failedMasters.split('|');
          if (
            this.failedMasterList !== undefined &&
            this.failedMasterList !== null &&
            this.failedMasterList.length > 0 &&
            this.failedMasterList[this.failedMasterList.length - 1].trim() ===
              ''
          )
            this.failedMasterList.pop();
          this.showProgressBar = false;
          clearInterval(this.intervalref);
          this.confirmationService.alert('Master download finished');
        }
      }
    });
  }

  canDeactivate() {
    if (this.showProgressBar) {
      this.confirmationService.alert('Download in progress');
      return false;
    } else {
      return true;
    }
  }
  checkBenIDAvailability() {
    this.dataSyncService
      .checkBenIDAvailability()
      .subscribe((benIDResponse: any) => {
        if (benIDResponse) {
          this.benID_Count = benIDResponse.data.response;
        } else {
          this.confirmationService.alert('No benID available. Generate benIDs');
        }
      });
  }
  get benIDsRange() {
    return this.generateBenIDForm.controls['benID_Range'].value;
  }
  generateBenID(benID: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    if (this.benID_Count > 5000) {
      this.confirmationService.alert(
        "Couldn't able to generate benIDs, count should be less than 5000"
      );
    } else {
      const reqObj = {
        vanID: vanID,
        benIDRequired: parseInt(benID),
      };
      this.dataSyncService.generateBenIDs(reqObj).subscribe(res => {
        if (res) {
          this.checkBenIDAvailability();
          this.generateBenIDForm.controls['benID_Range'].reset();
        }
      });
    }
  }
  inventoryFailedMasterList: any;
  inventorySyncDataDownload() {
    this.inventoryFailedMasterList = undefined;
    this.progressValue = 0;
    this.confirmationService
      .confirm('info', 'Confirm to download data')
      .subscribe(result => {
        if (result) {
          const vanID = {
            vanID: JSON.parse(
              this.sessionstorage.getItem('serviceLineDetails') ?? '{}'
            )?.vanID,
          };
          this.dataSyncService
            .inventorySyncDownloadData(vanID)
            .subscribe((res: any) => {
              if (res.statusCode === 200) {
                console.log('Downloaded response');
              } else {
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            });
        }
      });
  }
}
