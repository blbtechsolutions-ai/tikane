import { environment } from '../../../environments/environment';

type RuntimeWindow = Window & {
  __env?: {
    API_URL?: string;
  };
};

export function getApiUrl(): string {
  const runtimeApiUrl = (window as RuntimeWindow).__env?.API_URL?.trim();
  return runtimeApiUrl || environment.apiUrl;
}
