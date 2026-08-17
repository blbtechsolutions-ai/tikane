import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toastr: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.toastr.error('Impossible de contacter le serveur. Vérifiez votre connexion.', 'Erreur réseau');
        } else if (error.status !== 401) {
          const message = error.error?.message ?? this.getDefaultMessage(error.status);
          const errors = error.error?.errors;
          if (errors?.length) {
            errors.forEach((e: { field: string; message: string }) => {
              this.toastr.error(e.message, `Champ: ${e.field}`);
            });
          } else {
            this.toastr.error(message, `Erreur ${error.status}`);
          }
        }
        return throwError(() => error);
      }),
    );
  }

  private getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Requête invalide',
      403: 'Accès refusé',
      404: 'Ressource introuvable',
      409: 'Conflit de données',
      422: 'Données invalides',
      429: 'Trop de requêtes, veuillez patienter',
      500: 'Erreur serveur interne',
      503: 'Service temporairement indisponible',
    };
    return messages[status] ?? 'Une erreur est survenue';
  }
}
