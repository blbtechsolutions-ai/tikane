import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '../models/payment.model';
import { getApiUrl } from '../config/runtime-config';

type NestedPaginatedApiResponse<T> = { success: boolean; data: PaginatedResponse<T> };
type FlattenedPaginatedApiResponse<T> = {
  success: boolean;
  data: T[];
  pagination?: PaginatedResponse<T>['pagination'];
};
type PaginatedApiResponse<T> = NestedPaginatedApiResponse<T> | FlattenedPaginatedApiResponse<T>;

function isFlattenedPaginatedResponse<T>(
  response: PaginatedApiResponse<T>,
): response is FlattenedPaginatedApiResponse<T> {
  return Array.isArray(response.data);
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly baseUrl = getApiUrl();

  constructor(protected http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body?: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`);
  }

  getPaginated<T>(path: string, params?: Record<string, any>): Observable<{ success: boolean; data: PaginatedResponse<T> }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get<PaginatedApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams }).pipe(
      map((response) => {
        if (isFlattenedPaginatedResponse(response)) {
          return {
            success: response.success,
            data: {
              data: response.data,
              pagination: response.pagination ?? {
                page: 1,
                limit: response.data.length,
                total: response.data.length,
                totalPages: response.data.length === 0 ? 0 : 1,
                hasNext: false,
                hasPrev: false,
              },
            },
          };
        }

        return response as NestedPaginatedApiResponse<T>;
      }),
    );
  }
}
