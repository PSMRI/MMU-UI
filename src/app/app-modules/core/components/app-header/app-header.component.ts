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

import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, ConfirmationService } from '../../services';
import { HttpServiceService } from '../../services/http-service.service';
import { IotService } from '../../services/iot.service';
import { IotBluetoothComponent } from '../iot-bluetooth/iot-bluetooth.component';
import { ShowCommitAndVersionDetailsComponent } from '../show-commit-and-version-details/show-commit-and-version-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent implements OnInit {
  navigation = [
    {
      role: 'Registrar',
      link: '/registrar/search',
      label: 'Registrar',
      // work: [
      //   { link: '/registrar/registration', label: 'Registration' },
      //   { link: '/registrar/search', label: 'Search' },
      // ],
    },
    { role: 'Nurse', link: '/nurse-worklist', label: 'Nurse' },
    { role: 'Doctor', link: '/doctor-worklist', label: 'Doctor' },
    { role: 'Lab Technician', link: '/lab/worklist', label: 'Lab Technician' },
    {
      role: 'Pharmacist',
      link: '/pharmacist/pharmacist-worklist',
      label: 'Pharmacist',
    },
    {
      role: 'Radiologist',
      link: '/radiologist-worklist',
      label: 'Radiologist',
    },
    {
      role: 'Oncologist',
      link: '/oncologist-worklist',
      label: 'Oncologist',
    },
    { role: 'DataSync', link: '/datasync', label: 'Data Sync' },
    { role: 'Reports', link: '/reports', label: 'Reports' },
  ];
  language_file_path: any = './assets/';
  app_language: any = 'English';
  currentLanguageSet: any;
  languageArray: any;
  @Input()
  showRoles = false;

  servicePoint!: any;
  userName!: any;
  isAuthenticated!: boolean;
  roles: any;
  helpURL: string = environment.licenseURL;
  filteredNavigation: any;
  isConnected = true;
  status!: any;
  constructor(
    private dialog: MatDialog,
    private router: Router,
    private auth: AuthService,
    private confirmationService: ConfirmationService,
    public service: IotService,
    readonly sessionstorage: SessionStorageService,
    private http_service: HttpServiceService
  ) {}

  ngOnInit() {
    this.service.disconnectValue$.subscribe(response => {
      if (response === undefined) this.isConnected = false;
      else this.isConnected = response;
    });
    this.getUIVersionAndCommitDetails();
    this.servicePoint = this.sessionstorage.getItem('servicePointName');
    this.userName = this.sessionstorage.getItem('userName');
    this.isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
    if (this.showRoles) {
      const role: any = this.sessionstorage.getItem('role');
      this.roles = JSON.parse(role);
      this.filteredNavigation = this.navigation.filter(item => {
        if (this.roles !== null && this.roles.length > 0)
          return this.roles.includes(item.role);
      });
    }
    if (this.isAuthenticated) {
      this.fetchLanguageSet();
    }
    console.log(this.filteredNavigation, 'filter');
    this.status = this.sessionstorage.getItem('providerServiceID');
  }

  DataSync() {
    this.router.navigate(['/datasync']);
  }
  fetchLanguageSet() {
    this.http_service.fetchLanguageSet().subscribe((languageRes: any) => {
      if (
        languageRes &&
        languageRes.data !== undefined &&
        languageRes !== null
      ) {
        this.languageArray = languageRes.data;
        this.getLanguage();
      }
    });
    console.log('language array' + this.languageArray);
  }
  changeLanguage(language: any) {
    this.http_service
      .getLanguage(this.language_file_path + language + '.json')
      .subscribe(
        response => {
          if (response !== undefined && response !== null) {
            this.languageSuccessHandler(response, language);
          } else {
            alert(this.currentLanguageSet.alerts.info.langNotDefinesd);
          }
        },
        error => {
          alert(
            this.currentLanguageSet.alerts.info.comingUpWithThisLang +
              ' ' +
              language
          );
        }
      );
  }
  getLanguage() {
    if (sessionStorage.getItem('setLanguage') !== null) {
      this.changeLanguage(sessionStorage.getItem('setLanguage'));
    } else {
      this.changeLanguage(this.app_language);
    }
  }

  languageSuccessHandler(response: any, language: any) {
    console.log('language is ', response);
    if (response === undefined) {
      alert(this.currentLanguageSet.alerts.info.langNotDefinesd);
    }

    if (response[language] !== undefined) {
      this.currentLanguageSet = response[language];
      sessionStorage.setItem('setLanguage', language);
      if (this.currentLanguageSet) {
        this.languageArray.forEach((item: any) => {
          if (item.languageName === language) {
            this.app_language = language;
          }
        });
      } else {
        this.app_language = language;
      }

      this.http_service.getCurrentLanguage(response[language]);
      this.rolenavigation();
    } else {
      alert(
        this.currentLanguageSet.alerts.info.comingUpWithThisLang +
          ' ' +
          language
      );
    }
  }
  logout() {
    this.auth.logout().subscribe(res => {
      this.router.navigate(['/login']).then(result => {
        if (result) {
          this.changeLanguage('English');
          // this.sessionstorage.clear();
          sessionStorage.clear();
        }
      });
    });
  }
  rolenavigation() {
    this.navigation = [
      {
        role: 'Registrar',
        link: '/registrar/search',
        label: this.currentLanguageSet.role_selection.Registrar,

        // work: [
        //   {
        //     link: '/registrar/registration',
        //     label: this.currentLanguageSet.ro.registration,
        //   },
        //   {
        //     link: '/registrar/search',
        //     label: this.currentLanguageSet.common.search,
        //   },
        // ],
      },
      {
        role: 'Nurse',
        link: '/nurse-doctor/nurse-worklist',
        label: this.currentLanguageSet.role_selection.Nurse,
      },
      {
        role: 'Doctor',
        link: '/nurse-doctor/doctor-worklist',
        label: this.currentLanguageSet.role_selection.Doctor,
      },
      {
        role: 'Lab Technician',
        link: '/lab/worklist',
        label: this.currentLanguageSet.role_selection.LabTechnician,
      },
      {
        role: 'Pharmacist',
        link: '/pharmacist/pharmacist-worklist',
        label: this.currentLanguageSet.role_selection.Pharmacist,
      },
      {
        role: 'Radiologist',
        link: '/nurse-doctor/radiologist-worklist',
        label: this.currentLanguageSet.role_selection.Radiologist,
      },
      {
        role: 'Oncologist',
        link: '/nurse-doctor/oncologist-worklist',
        label: this.currentLanguageSet.role_selection.Oncologist,
      },
      {
        role: 'DataSync',
        link: '/datasync',
        label: this.currentLanguageSet.common.dataSync,
      },
    ];
    if (this.showRoles) {
      const role: any = this.sessionstorage.getItem('role');
      this.roles = JSON.parse(role);
      if (this.roles !== undefined && this.roles !== null) {
        this.filteredNavigation = this.navigation.filter(item => {
          return this.roles.includes(item.role);
        });
      }
    }
  }
  commitDetailsUI: any;
  versionUI: any;
  getUIVersionAndCommitDetails() {
    const commitDetailsPath: any = 'assets/git-version.json';
    this.auth.getUIVersionAndCommitDetails(commitDetailsPath).subscribe(
      res => {
        console.log('res', res);
        this.commitDetailsUI = res;
        this.versionUI = this.commitDetailsUI['version'];
      },
      err => {
        console.log('err', err);
      }
    );
  }
  showVersionAndCommitDetails() {
    this.auth.getAPIVersionAndCommitDetails().subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.constructAPIAndUIDetails(res.data);
        }
      },
      err => {}
    );
  }
  constructAPIAndUIDetails(apiVersionAndCommitDetails: any) {
    const data = {
      commitDetailsUI: {
        version: this.commitDetailsUI['version'],
        commit: this.commitDetailsUI['commit'],
      },
      commitDetailsAPI: {
        version: apiVersionAndCommitDetails['git.build.version'] || 'NA',
        commit: apiVersionAndCommitDetails['git.commit.id'] || 'NA',
      },
    };
    if (data) {
      this.showData(data);
    }
  }
  showData(versionData: any) {
    this.dialog.open(ShowCommitAndVersionDetailsComponent, {
      data: versionData,
    });
  }

  openIOT() {
    this.dialog.open(IotBluetoothComponent, {
      width: '600px',
    });
  }
}
