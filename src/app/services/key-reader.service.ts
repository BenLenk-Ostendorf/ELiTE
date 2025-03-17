import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyReaderService {
  private keyCache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  /**
   * Read an API key from a file
   * @param keyPath Path to the key file
   * @returns Observable with the key as a string
   */
  readKey(keyPath: string): Observable<string> {
    // Check if we already have this key in cache
    if (this.keyCache.has(keyPath)) {
      return of(this.keyCache.get(keyPath) as string);
    }

    // Read the key from the file
    return this.http.get(keyPath, { responseType: 'text' }).pipe(
      map(key => {
        const trimmedKey = key.trim();
        // Cache the key for future use
        this.keyCache.set(keyPath, trimmedKey);
        return trimmedKey;
      }),
      catchError(error => {
        console.error(`Error reading API key from ${keyPath}:`, error);
        return of('');
      })
    );
  }
}
