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
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService, ConfirmationService } from '../../services';
import { HttpServiceService } from '../../services/http-service.service';
import { IotService } from '../../services/iot.service';
import { IotBluetoothComponent } from '../iot-bluetooth/iot-bluetooth.component';
import { ShowCommitAndVersionDetailsComponent } from '../show-commit-and-version-details/show-commit-and-version-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createHttpServiceMock,
  throwingObs,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AppHeaderComponent } from './app-header.component';

const ROLES = ['Registrar', 'Nurse', 'Doctor', 'Lab Technician', 'Pharmacist'];

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let component: AppHeaderComponent;
  let auth: any;
  let http: any;
  let disconnect$: BehaviorSubject<any>;
  let confirm: any;
  let dialog: any;
  let router: Router;
  let sessionSeed: Record<string, any>;

  const create = (
    opts: { showRoles?: boolean; authenticated?: boolean } = {}
  ) => {
    if (opts.authenticated) sessionStorage.setItem('isAuthenticated', 'true');
    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    component.showRoles = !!opts.showRoles;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    sessionSeed = {
      servicePointName: 'barpeta sp',
      userName: 'prabhsimran singh',
      providerServiceID: 3,
      role: JSON.stringify(ROLES),
    };
    auth = autoSpy(AuthService);
    auth.getUIVersionAndCommitDetails.and.returnValue(
      of({ version: '3.0.0', commit: 'uicommit' })
    );
    http = {
      ...createHttpServiceMock(),
      getLanguage: jasmine
        .createSpy('getLanguage')
        .and.returnValue(of({ English: LANGUAGE_EN })),
    };
    http.fetchLanguageSet.and.returnValue(
      of({ data: [{ languageName: 'English' }, { languageName: 'Hindi' }] })
    );
    disconnect$ = new BehaviorSubject<any>(true);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatMenuModule],
      declarations: [AppHeaderComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: HttpServiceService, useValue: http },
        { provide: AuthService, useValue: auth },
        {
          provide: IotService,
          useValue: { disconnectValue$: disconnect$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    fixture?.destroy();
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('setLanguage');
  });

  describe('ngOnInit', () => {
    it('reads service point, user name and provider from session storage', () => {
      create();
      expect(component.servicePoint).toBe('barpeta sp');
      expect(component.userName).toBe('prabhsimran singh');
      expect(component.status).toBe(3);
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Prabhsimran Singh');
      expect(text).toContain('Barpeta Sp');
    });

    it('is not authenticated and skips language fetch without the session flag', () => {
      create();
      expect(component.isAuthenticated).toBeFalse();
      expect(http.fetchLanguageSet).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.logout')).toBeNull();
    });

    it('loads UI version details', () => {
      create();
      expect(auth.getUIVersionAndCommitDetails).toHaveBeenCalledWith(
        'assets/git-version.json'
      );
      expect(component.versionUI).toBe('3.0.0');
    });

    it('tolerates UI version load failure', () => {
      auth.getUIVersionAndCommitDetails.and.returnValue(throwingObs());
      create();
      expect(component.versionUI).toBeUndefined();
    });

    it('tracks bluetooth connection state', () => {
      create();
      expect(component.isConnected).toBeTrue();
      disconnect$.next(false);
      expect(component.isConnected).toBeFalse();
      disconnect$.next(true);
      disconnect$.next(undefined);
      expect(component.isConnected).toBeFalse();
    });

    it('does not compute roles when showRoles is false', () => {
      create();
      expect(component.roles).toBeUndefined();
      expect(component.filteredNavigation).toBeUndefined();
    });

    it('filters navigation by stored roles when showRoles is true', () => {
      create({ showRoles: true });
      expect(component.roles).toEqual(ROLES);
      expect(component.filteredNavigation.map((n: any) => n.role)).toEqual(
        ROLES
      );
      const buttons = fixture.nativeElement.querySelectorAll('.nav-btn');
      expect(buttons.length).toBe(ROLES.length + 1);
    });

    it('yields empty navigation when no roles stored', () => {
      (TestBed.inject(SessionStorageService) as any).store.set('role', '[]');
      create({ showRoles: true });
      expect(component.filteredNavigation).toEqual([]);
    });
  });

  describe('when authenticated', () => {
    it('fetches languages and applies stored/default language', () => {
      create({ authenticated: true, showRoles: true });
      expect(component.isAuthenticated).toBeTrue();
      expect(component.languageArray.length).toBe(2);
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
      expect(component.app_language).toBe('English');
      expect(sessionStorage.getItem('setLanguage')).toBe('English');
      expect(http.getCurrentLanguage).toHaveBeenCalledWith(LANGUAGE_EN);
      expect(
        component.filteredNavigation.find((n: any) => n.role === 'Nurse').link
      ).toBe('/nurse-doctor/nurse-worklist');
      expect(fixture.nativeElement.querySelector('.logout')).not.toBeNull();
    });

    it('uses the language saved in session storage', () => {
      sessionStorage.setItem('setLanguage', 'Hindi');
      http.getLanguage.and.returnValue(of({ Hindi: { ...LANGUAGE_EN } }));
      create({ authenticated: true });
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/Hindi.json');
      expect(component.app_language).toBe('Hindi');
    });

    it('ignores language set response without data', () => {
      http.fetchLanguageSet.and.returnValue(of({}));
      create({ authenticated: true });
      expect(http.getLanguage).not.toHaveBeenCalled();
    });
  });

  describe('changeLanguage / languageSuccessHandler', () => {
    beforeEach(() => {
      create();
      component.languageArray = [{ languageName: 'English' }];
    });

    it('alerts with fallback text when the language file is empty', () => {
      http.getLanguage.and.returnValue(of(null));
      component.changeLanguage('Tamil');
      expect(confirm.alert).toHaveBeenCalledWith(
        'Selected language is not defined',
        'error'
      );
    });

    it('alerts with localized text when file load fails', () => {
      component.currentLanguageSet = LANGUAGE_EN;
      http.getLanguage.and.returnValue(throwingObs());
      component.changeLanguage('Tamil');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Tamil',
        'error'
      );
    });

    it('alerts with fallback when file load fails and no language set', () => {
      http.getLanguage.and.returnValue(throwingObs());
      component.changeLanguage('Tamil');
      expect(confirm.alert).toHaveBeenCalledWith(
        'Selected language is coming up with Tamil',
        'error'
      );
    });

    it('languageSuccessHandler alerts for undefined response', () => {
      component.currentLanguageSet = LANGUAGE_EN;
      component.languageSuccessHandler(undefined, 'English');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.langNotDefinesd,
        'error'
      );
    });

    it('languageSuccessHandler alerts when language key missing', () => {
      component.languageSuccessHandler({ Other: {} }, 'Tamil');
      expect(confirm.alert).toHaveBeenCalledWith(
        'Selected language is coming up with Tamil',
        'error'
      );
      expect(sessionStorage.getItem('setLanguage')).toBeNull();
    });

    it('languageSuccessHandler keeps app_language when not in language list', () => {
      component.languageSuccessHandler({ Tamil: LANGUAGE_EN }, 'Tamil');
      expect(component.app_language).toBe('English');
      expect(sessionStorage.getItem('setLanguage')).toBe('Tamil');
    });

    it('languageSuccessHandler with null language object: sets app_language then fails role navigation', () => {
      expect(() =>
        component.languageSuccessHandler({ Tamil: null }, 'Tamil')
      ).toThrowError(TypeError);
      expect(component.app_language).toBe('Tamil');
    });

    it('selecting a language in the dropdown calls changeLanguage', () => {
      component.languageArray = [
        { languageName: 'English' },
        { languageName: 'Hindi' },
      ];
      fixture.detectChanges();
      const spy = spyOn(component, 'changeLanguage');
      const select: HTMLSelectElement =
        fixture.nativeElement.querySelector('select');
      select.value = 'Hindi';
      select.dispatchEvent(new Event('change'));
      expect(spy).toHaveBeenCalledWith('Hindi');
    });
  });

  it('rolenavigation without showRoles leaves filteredNavigation unset', () => {
    create();
    component.currentLanguageSet = LANGUAGE_EN;
    component.rolenavigation();
    expect(component.navigation.length).toBe(8);
    expect(component.navigation[7].label).toBe(LANGUAGE_EN.common.dataSync);
    expect(component.filteredNavigation).toBeUndefined();
  });

  it('rolenavigation with showRoles and no stored roles keeps previous filter', () => {
    create({ showRoles: true });
    const previous = component.filteredNavigation;
    const ss: any = component.sessionstorage;
    ss.store.delete('role');
    component.currentLanguageSet = LANGUAGE_EN;
    component.rolenavigation();
    expect(component.roles).toBeNull();
    expect(component.filteredNavigation).toBe(previous);
  });

  it('DataSync navigates to the data sync module', () => {
    create();
    component.DataSync();
    expect(router.navigate).toHaveBeenCalledWith(['/datasync']);
  });

  describe('logout', () => {
    it('logs out, navigates to login, resets language and clears session storage', fakeAsync(() => {
      create({ authenticated: true });
      http.getLanguage.calls.reset();
      sessionStorage.setItem('foo', 'bar');
      (fixture.nativeElement.querySelector('.logout a') as HTMLElement).click();
      flush();
      expect(auth.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(sessionStorage.getItem('foo')).toBeNull();
    }));

    it('does nothing further when navigation fails', fakeAsync(() => {
      create();
      (router.navigate as jasmine.Spy).and.resolveTo(false);
      sessionStorage.setItem('foo', 'bar');
      component.logout();
      flush();
      expect(http.getLanguage).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('foo')).toBe('bar');
      sessionStorage.removeItem('foo');
    }));
  });

  describe('version details', () => {
    beforeEach(() => create());

    it('opens version dialog with API and UI details', () => {
      auth.getAPIVersionAndCommitDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { 'git.build.version': '2.1', 'git.commit.id': 'apicommit' },
        })
      );
      component.showVersionAndCommitDetails();
      expect(dialog.open).toHaveBeenCalledWith(
        ShowCommitAndVersionDetailsComponent,
        {
          data: {
            commitDetailsUI: { version: '3.0.0', commit: 'uicommit' },
            commitDetailsAPI: { version: '2.1', commit: 'apicommit' },
          },
        }
      );
    });

    it('uses NA when API details are missing', () => {
      component.constructAPIAndUIDetails({});
      expect(
        dialog.open.calls.mostRecent().args[1].data.commitDetailsAPI
      ).toEqual({
        version: 'NA',
        commit: 'NA',
      });
    });

    it('does not open dialog on non-200 or error', () => {
      auth.getAPIVersionAndCommitDetails.and.returnValue(
        of({ statusCode: 500 })
      );
      component.showVersionAndCommitDetails();
      auth.getAPIVersionAndCommitDetails.and.returnValue(throwingObs());
      component.showVersionAndCommitDetails();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  it('openIOT opens the bluetooth dialog from the header icon', () => {
    create({ authenticated: true });
    (fixture.nativeElement.querySelector('.iot') as HTMLElement).click();
    expect(dialog.open).toHaveBeenCalledWith(IotBluetoothComponent, {
      width: '600px',
    });
  });
});
