import { HttpHeaders } from '@angular/common/http';
import { AIService } from './ai.service';
import { environment } from '../../environments/environment';

export function initializeAIServices(aiService: AIService): () => void {
  return () => {
    // Initialize OpenAI
    const openaiConfig = environment.openai;
    aiService.registerService('openai', {
      apiUrl: openaiConfig.apiUrl,
      apiKey: openaiConfig.apiKey,
      model: openaiConfig.model,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiConfig.apiKey}`
      })
    });

    // Add initialization for other AI services as needed
    
    console.log('AI services initialized');
  };
}
