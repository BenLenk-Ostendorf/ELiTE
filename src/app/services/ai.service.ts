import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retryWhen, mergeMap, finalize, delay } from 'rxjs/operators';

export interface AIServiceConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  headers?: HttpHeaders;
  maxRetries?: number;
  retryDelay?: number;
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
    // Set default values for retry configuration
    if (!config.maxRetries) config.maxRetries = 3;
    if (!config.retryDelay) config.retryDelay = 1000; // 1 second
    
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
        console.log(`Sending request to ${config.apiUrl}:`, requestBody);
        console.log('Using headers:', config.headers);
        break;
      // Add cases for other AI services as needed
      default:
        return throwError(() => new Error(`Unknown AI service: ${serviceName}`));
    }

    return this.http.post<any>(config.apiUrl, requestBody, { headers: config.headers })
      .pipe(
        retryWhen(errors => 
          errors.pipe(
            mergeMap((error, i) => {
              const retryAttempt = i + 1;
              
              // Only retry on rate limiting errors (429)
              if (error instanceof HttpErrorResponse && error.status === 429 && retryAttempt <= (config.maxRetries || 3)) {
                console.log(`Rate limit exceeded. Retrying in ${(config.retryDelay || 1000) * retryAttempt}ms (Attempt ${retryAttempt})`);
                
                // Use exponential backoff for retries
                return timer((config.retryDelay || 1000) * Math.pow(2, retryAttempt - 1));
              }
              
              // If it's not a rate limiting error or we've exceeded max retries, throw the error
              return throwError(() => error);
            }),
            finalize(() => console.log('Retry logic completed'))
          )
        ),
        catchError(error => {
          if (error instanceof HttpErrorResponse) {
            // Handle specific HTTP errors
            switch (error.status) {
              case 429:
                console.error('OpenAI API rate limit exceeded. Please try again later.');
                return throwError(() => new Error(`Failed to get response from ${serviceName}: Rate limit exceeded. Please try again later.`));
              case 401:
                console.error('Authentication error. Please check your API key.');
                return throwError(() => new Error(`Failed to get response from ${serviceName}: Authentication error. Please check your API key.`));
              case 400:
                console.error('Bad request:', error.error);
                return throwError(() => new Error(`Failed to get response from ${serviceName}: Bad request - ${error.error?.error?.message || error.message}`));
              case 500:
              case 502:
              case 503:
              case 504:
                console.error('OpenAI API server error:', error.status);
                return throwError(() => new Error(`Failed to get response from ${serviceName}: Server error (${error.status}). Please try again later.`));
              default:
                console.error(`Error calling ${serviceName} API:`, error);
                return throwError(() => new Error(`Failed to get response from ${serviceName}: ${error.message}`));
            }
          }
          
          console.error(`Error calling ${serviceName} API:`, error);
          return throwError(() => new Error(`Failed to get response from ${serviceName}: ${error.message}`));
        }),
        map(response => {
          try {
            return this.processResponse(serviceName, response);
          } catch (error: any) {
            console.error(`Error processing ${serviceName} response:`, error);
            throw new Error(`Failed to parse ${serviceName} response: ${error.message}`);
          }
        })
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
   * Process the response from various AI services
   */
  private processResponse(serviceName: string, response: any): AIResponse {
    console.log(`Processing ${serviceName} response:`, JSON.stringify(response));
    
    switch (serviceName) {
      case 'openai':
        if (!response) {
          throw new Error('Empty response received from OpenAI');
        }
        
        if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
          throw new Error(`Invalid response format from OpenAI: missing or empty 'choices' array`);
        }
        
        const choice = response.choices[0];
        if (!choice.message) {
          throw new Error(`Invalid response format from OpenAI: missing 'message' in first choice`);
        }
        
        const content = choice.message.content;
        if (typeof content !== 'string') {
          throw new Error(`Invalid response format from OpenAI: 'content' is not a string`);
        }
        
        return {
          content,
          source: 'openai',
          raw: response
        };
      
      // Add cases for other AI services as needed
      default:
        throw new Error(`Unknown AI service: ${serviceName}`);
    }
  }
}
