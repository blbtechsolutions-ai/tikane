import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, LoginRequest, AuthTokens } from '../models/user.model';
import { StorageService } from './storage.service';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${getApiUrl()}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.storage.getUser(),
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.storage.hasValidToken(),
  );
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService,
  ) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(
      `${this.apiUrl}/login`,
      credentials,
    ).pipe(
      tap((res) => this.handleAuthSuccess(res.data)),
    ) as any;
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.storage.getRefreshToken();
    return this.http.post<{ success: boolean; data: AuthTokens }>(
      `${this.apiUrl}/refresh`,
      { refreshToken },
    ).pipe(
      tap((res: any) => {
        this.storage.setTokens(res.data.accessToken, res.data.refreshToken);
      }),
    ) as any;
  }

  logout(): void {
    const refreshToken = this.storage.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(
      `${this.apiUrl}/me`,
    ).pipe(
      tap((res: any) => {
        this.currentUserSubject.next(res.data);
        this.storage.setUser(res.data);
      }),
    ) as any;
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { token });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentUser?.role ?? '');
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN', 'SUPER_ADMIN');
  }

  isAgent(): boolean {
    return this.hasRole('AGENT');
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  private handleAuthSuccess(data: AuthResponse): void {
    this.storage.setTokens(data.accessToken, data.refreshToken);
    this.storage.setUser(data.user);
    this.currentUserSubject.next(data.user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearSession(): void {
    this.storage.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
