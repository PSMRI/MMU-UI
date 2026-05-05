import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: any, state: any) {
    return this.auth.validateSessionKey().pipe(
      map((res: any) =>
        res && res.statusCode === 200 && res.data
          ? true
          : this.router.createUrlTree(['/login'])
      ),
      catchError(() => of(this.router.createUrlTree(['/login'])))
    );
  }
}
