import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

const KEYS = {
  ACCESS_TOKEN: 'tkn_access',
  REFRESH_TOKEN: 'tkn_refresh',
  USER: 'tkn_user',
  THEME: 'tkn_theme',
  LANGUAGE: 'tkn_lang',
};

@Injectable({ providedIn: 'root' })
export class StorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  }

  getUser(): User | null {
    const user = localStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') ?? 'light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(KEYS.THEME, theme);
  }

  getLanguage(): 'fr' | 'ht' {
    return (localStorage.getItem(KEYS.LANGUAGE) as 'fr' | 'ht') ?? 'fr';
  }

  setLanguage(lang: 'fr' | 'ht'): void {
    localStorage.setItem(KEYS.LANGUAGE, lang);
  }

  clear(): void {
    [KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN, KEYS.USER].forEach((k) =>
      localStorage.removeItem(k),
    );
  }
}
