import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable()
export class HttpServiceService {
  language!: any;

  private _listners = new Subject<any>();

  listen(): Observable<any> {
    return this._listners.asObservable();
  }

  filter(filterBy: string) {
    this._listners.next(filterBy);
  }
  appCurrentLanguge = new BehaviorSubject(this.language);
  currentLangugae$ = this.appCurrentLanguge.asObservable();

  constructor(
    private _http: HttpClient,
    private http: HttpClient
  ) {
    const storedLang = localStorage.getItem('appLanguage');
    this.language = storedLang ? JSON.parse(storedLang) : null;
    // Seed the subject from the persisted language. The field initializer above
    // ran before this, so the BehaviorSubject started as undefined; without this
    // a fresh instance (e.g. the nurse-doctor-scoped one created on a hard F5)
    // would expose no language until getCurrentLanguage() runs, leaving worklist
    // headers / labels blank on reload.
    if (this.language) {
      this.appCurrentLanguge.next(this.language);
    }
  }

  fetchLanguageSet() {
    console.log('Here i come');
    return this.http.get(environment.getLanguageList);
  }
  getLanguage(url: string) {
    return this._http.get(url);
  }
  getCurrentLanguage(response: any) {
    this.language = response;
    localStorage.setItem('appLanguage', JSON.stringify(response));
    this.appCurrentLanguge.next(response);
  }
}
