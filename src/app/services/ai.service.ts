import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AIServiceConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  headers?: HttpHeaders;
}

export interface AIRequest {
  question: string;
  options?: any;
}

export interface AIResponse {
  content: string;
  source: string;
  raw?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private configs: Map<string, AIServiceConfig> = new Map();

  constructor(private http: HttpClient) { }

  /**
   * Register an AI service configuration
   * @param serviceName The name of the AI service (e.g., 'openai', 'anthropic', etc.)
   * @param config The configuration for the service
   */
  registerService(serviceName: string, config: AIServiceConfig): void {
    this.configs.set(serviceName, config);
  }

  /**
   * Send a question to a specific AI service
   * @param serviceName The name of the AI service to use
   * @param request The request containing the question and any options
   * @returns An observable of the AI response
   */
  sendQuestion(serviceName: string, request: AIRequest): Observable<AIResponse> {
    const config = this.configs.get(serviceName);
    
    if (!config) {
      return throwError(() => new Error(`AI service '${serviceName}' not registered`));
    }

    // Different services have different request formats
    let requestBody: any;
    
    switch (serviceName) {
      case 'openai':
        requestBody = this.formatOpenAIRequest(request, config);
        break;
      // Add cases for other AI services as needed
      default:
        return throwError(() => new Error(`Unknown AI service: ${serviceName}`));
    }

    return this.http.post<any>(config.apiUrl, requestBody, { headers: config.headers })
      .pipe(
        catchError(error => {
          console.error(`Error calling ${serviceName} API:`, error);
          return throwError(() => new Error(`Failed to get response from ${serviceName}: ${error.message}`));
        }),
        // Map the response to a standardized format
        // Each service will need its own response mapping
        (response: any) => this.mapResponse(serviceName, response)
      );
  }

  /**
   * Format the request for OpenAI
   */
  private formatOpenAIRequest(request: AIRequest, config: AIServiceConfig): any {
    return {
      model: config.model,
      messages: [
        { role: 'user', content: request.question }
      ],
      temperature: request.options?.temperature || 0.7,
      max_tokens: request.options?.maxTokens || 1000
    };
  }

  /**
   * Map the response from various AI services to a standardized format
   */
  private mapResponse(serviceName: string, response: any): Observable<AIResponse> {
    switch (serviceName) {
      case 'openai':
        return new Observable<AIResponse>(observer => {
          try {
            const content = response.choices[0]?.message?.content || '';
            observer.next({
              content,
              source: 'openai',
              raw: response
            });
            observer.complete();
          } catch (error) {
            observer.error(new Error(`Failed to parse OpenAI response: ${error}`));
          }
        });
      // Add cases for other AI services as needed
      default:
        return throwError(() => new Error(`Unknown AI service: ${serviceName}`));
    }
  }
}
