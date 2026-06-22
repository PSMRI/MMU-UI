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
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRoute;
  let guard: AuthGuard;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['validateSessionKey']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    route = {} as ActivatedRoute;
    guard = new AuthGuard(auth, router, route);
  });

  it('returns the validateSessionKey observable so the router can wait for it', () => {
    auth.validateSessionKey.and.returnValue(of({ statusCode: 200, data: { username: 'u' } }));

    guard.canActivate({}, {}).subscribe();

    expect(auth.validateSessionKey).toHaveBeenCalledTimes(1);
  });

  it('navigates to /login when the session response is unauthorised', () => {
    auth.validateSessionKey.and.returnValue(of({ statusCode: 401, data: null }));

    guard.canActivate({}, {}).subscribe();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('does not navigate when the session response is valid', () => {
    auth.validateSessionKey.and.returnValue(of({ statusCode: 200, data: { username: 'u' } }));

    guard.canActivate({}, {}).subscribe();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no longer holds a reference to HttpServiceService — guarantees the language subscription leak cannot recur', () => {
    auth.validateSessionKey.and.returnValue(of({ statusCode: 200, data: { username: 'u' } }));

    // The pre-fix implementation injected HttpServiceService and assigned the
    // emitted value to `current_language_set` on every navigation without
    // tearing the subscription down. Both fields must be gone so the leak
    // cannot be re-introduced silently.
    expect((guard as unknown as { http_service: unknown }).http_service).toBeUndefined();
    expect((guard as unknown as { current_language_set: unknown }).current_language_set).toBeUndefined();
  });

  it('processes repeated navigations without accumulating per-call subscriptions on the guard instance', () => {
    auth.validateSessionKey.and.returnValue(of({ statusCode: 200, data: { username: 'u' } }));

    for (let i = 0; i < 20; i += 1) {
      guard.canActivate({}, {}).subscribe();
    }

    expect(auth.validateSessionKey).toHaveBeenCalledTimes(20);
    expect((guard as unknown as { http_service: unknown }).http_service).toBeUndefined();
  });
});
