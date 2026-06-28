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
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import {
  AuthService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { CaptchaComponent } from '../captcha/captcha.component';
import { AmritTrackingService } from 'Common-UI/v2/tracking';
import { StringValidatorDirective } from '../core/directives/stringValidator.directive';
import { NgIf } from '@angular/common';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { CampHubQrCodeComponent } from '../data-sync/camp-hub-qr-code/camp-hub-qr-code.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUser,
  lucideLock,
  lucideEye,
  lucideEyeOff,
  lucideQrCode,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-login-cmp',
  templateUrl: './login.component.html',
  host: { class: 'block min-h-screen' },
  imports: [
    ReactiveFormsModule,
    StringValidatorDirective,
    NgIf,
    CaptchaComponent,
    RouterLink,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...cardImports,
    NgIcon,
  ],
  viewProviders: [
    provideIcons({
      lucideUser,
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideQrCode,
    }),
  ],
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('captchaCmp') captchaCmp: CaptchaComponent | undefined;
  dynamictype = 'password';
  encryptedVar: any;
  key: any;
  iv: any;
  SALT = 'RandomInitVector';
  Key_IV = 'Piramal12Piramal';
  encPassword: any;
  _keySize: any;
  _ivSize: any;
  _iterationCount: any;

  @ViewChild('focus') private elementRef!: ElementRef;

  captchaToken!: string;
  enableCaptcha = environment.enableCaptcha;
  isMMUOfflineQRCode = environment.isMMUOfflineQRCode;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly confirmationService: ConfirmationService,
    private readonly fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
    private readonly trackingService: AmritTrackingService,
    private readonly dialogService: ZardDialogService
  ) {
    this._keySize = 256;
    this._ivSize = 128;
    this._iterationCount = 1989;
  }

  loginForm = this.fb.group({
    userName: ['', Validators.required],
    password: ['', Validators.required],
  });

  ngOnInit() {
    if (sessionStorage.getItem('isAuthenticated')) {
      this.authService.validateSessionKey().subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data)
          this.router.navigate(['/service']);
      });
    } else {
      sessionStorage.clear();
    }
  }
  ngAfterViewInit(): void {
    this.elementRef.nativeElement.focus();
  }

  login() {
    const encryptPassword = this.encrypt(
      this.Key_IV,
      this.loginForm.controls.password.value
    );

    if (this.loginForm.valid) {
      this.authService
        .login(
          this.loginForm.controls.userName.value?.trim() ?? '',
          encryptPassword,
          false,
          this.enableCaptcha ? this.captchaToken : undefined
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              if (res?.data?.previlegeObj[0]) {
                this.sessionstorage.setItem(
                  'loginDataResponse',
                  JSON.stringify(res.data)
                );
                this.getServicesAuthdetails(res.data);
              } else {
                this.confirmationService.alert(
                  'Seems you are logged in from somewhere else, Logout from there & try back in.',
                  'error'
                );
              }
            } else if (res.statusCode === 5002) {
              if (
                res.errorMessage ===
                'You are already logged in,please confirm to logout from other device and login again'
              ) {
                this.confirmationService
                  .confirm('info', res.errorMessage)
                  .subscribe(confirmResponse => {
                    if (confirmResponse) {
                      this.authService
                        .userlogoutPreviousSession(
                          this.loginForm.controls.userName.value
                        )
                        .subscribe((userlogoutPreviousSession: any) => {
                          if (userlogoutPreviousSession.statusCode === 200) {
                            this.authService
                              .login(
                                this.loginForm.controls.userName.value,
                                encryptPassword,
                                true,
                                this.enableCaptcha
                                  ? this.captchaToken
                                  : undefined
                              )
                              .subscribe((userLoggedIn: any) => {
                                if (userLoggedIn.statusCode === 200) {
                                  if (userLoggedIn?.data?.previlegeObj[0]) {
                                    this.sessionstorage.setItem(
                                      'loginDataResponse',
                                      JSON.stringify(userLoggedIn.data)
                                    );
                                    this.trackingService.setUserId(
                                      userLoggedIn.data.userID
                                    );
                                    this.getServicesAuthdetails(
                                      userLoggedIn.data
                                    );
                                  } else {
                                    this.resetCaptcha();
                                    this.confirmationService.alert(
                                      'Seems you are logged in from somewhere else, Logout from there & try back in.',
                                      'error'
                                    );
                                  }
                                } else {
                                  this.resetCaptcha();
                                  this.confirmationService.alert(
                                    userLoggedIn.errorMessage,
                                    'error'
                                  );
                                }
                              });
                          } else {
                            this.resetCaptcha();
                            this.confirmationService.alert(
                              userlogoutPreviousSession.errorMessage,
                              'error'
                            );
                          }
                        });
                    } else {
                      this.resetCaptcha();
                      sessionStorage.clear();
                      this.router.navigate(['/login']);
                    }
                  });
              } else {
                this.resetCaptcha();
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            }
          },
          err => {
            this.resetCaptcha();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  get keySize() {
    return this._keySize;
  }

  set keySize(value) {
    this._keySize = value;
  }

  get iterationCount() {
    return this._iterationCount;
  }

  set iterationCount(value) {
    this._iterationCount = value;
  }

  generateKey(salt: any, passPhrase: any) {
    return CryptoJS.PBKDF2(passPhrase, CryptoJS.enc.Hex.parse(salt), {
      hasher: CryptoJS.algo.SHA512,
      keySize: this.keySize / 32,
      iterations: this._iterationCount,
    });
  }

  encryptWithIvSalt(salt: any, iv: any, passPhrase: any, plainText: any) {
    const key = this.generateKey(salt, passPhrase);
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  }

  encrypt(passPhrase: any, plainText: any) {
    const iv = CryptoJS.lib.WordArray.random(this._ivSize / 8).toString(
      CryptoJS.enc.Hex
    );
    const salt = CryptoJS.lib.WordArray.random(this.keySize / 8).toString(
      CryptoJS.enc.Hex
    );
    const ciphertext = this.encryptWithIvSalt(salt, iv, passPhrase, plainText);
    return salt + iv + ciphertext;
  }

  getServicesAuthdetails(loginDataResponse: any) {
    const userName: any = this.loginForm.controls.userName.value;
    sessionStorage.setItem('key', loginDataResponse.key);
    sessionStorage.setItem(
      'isAuthenticated',
      loginDataResponse.isAuthenticated
    );
    this.sessionstorage.setItem('userID', loginDataResponse.userID);
    this.trackingService.setUserId(loginDataResponse.userID);
    this.sessionstorage.setItem('userName', loginDataResponse.userName);
    this.sessionstorage.setItem('username', userName);
    this.sessionstorage.setItem('fullName', loginDataResponse.fullName);
    this.sessionstorage.setItem(
      'providerServiceMapID',
      loginDataResponse.previlegeObj[0].providerServiceMapID
    );
    const services: any = [];
    loginDataResponse.previlegeObj.map((item: any) => {
      if (
        item.roles[0].serviceRoleScreenMappings[0].providerServiceMapping
          .serviceID === 2
      ) {
        this.sessionstorage.setItem(
          'currentServiceID',
          item.roles[0].serviceRoleScreenMappings[0].providerServiceMapping
            .serviceID
        );
        const service = {
          providerServiceID: item.serviceID,
          serviceName: item.serviceName,
          apimanClientKey: item.apimanClientKey,
          serviceID:
            item.roles[0].serviceRoleScreenMappings[0].providerServiceMapping
              .serviceID,
          serviceProviderID:
            item.roles[0].serviceRoleScreenMappings[0].providerServiceMapping
              .serviceProviderID,
        };
        services.push(service);
      }
    });
    if (services.length > 0) {
      this.sessionstorage.setItem('services', JSON.stringify(services));
      if (loginDataResponse.Status.toLowerCase() === 'new') {
        this.router.navigate(['/set-security-questions']);
      } else {
        this.router.navigate(['/service']);
      }
    } else {
      this.confirmationService.alert(
        "User doesn't have previlege to access the application"
      );
    }
  }

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  togglePWD() {
    this.dynamictype = this.dynamictype === 'text' ? 'password' : 'text';
  }

  openQrDialog(): void {
    this.dialogService.create({
      zTitle: 'Camp Hub QR Code',
      zContent: CampHubQrCodeComponent,
      zWidth: '460px',
      zHideFooter: true,
    });
  }

  onCaptchaResolved(token: any) {
    this.captchaToken = token;
  }

  resetCaptcha() {
    if (
      this.enableCaptcha &&
      this.captchaCmp &&
      typeof this.captchaCmp.reset === 'function'
    ) {
      this.captchaCmp.reset();
      this.captchaToken = '';
    }
  }
}
