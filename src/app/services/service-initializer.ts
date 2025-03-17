import { HttpHeaders } from '@angular/common/http';
import { AIService } from './ai.service';
import { KeyReaderService } from './key-reader.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export async function initializeAIServices(aiService: AIService, keyReader: KeyReaderService): Promise<void> {
  try {
    // Initialize OpenAI
    const openaiConfig = environment.openai;
    
    console.log(`Attempting to read API key from: ${openaiConfig.apiKeyPath}`);
    
    let apiKey: string;
    try {
      apiKey = await firstValueFrom(keyReader.readKey(openaiConfig.apiKeyPath));
    } catch (keyError) {
      console.error('Error reading OpenAI API key:', keyError);
      throw new Error(`Failed to read OpenAI API key: ${keyError}`);
    }
    
    if (!apiKey) {
      const error = new Error('OpenAI API key is empty or not found');
      console.error(error);
      throw error;
    }
    
    // Validate API key format (basic check)
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      const error = new Error('Invalid OpenAI API key format');
      console.error(error);
      throw error;
    }
    
    console.log('API key loaded successfully');
    
    aiService.registerService('openai', {
      apiUrl: openaiConfig.apiUrl,
      apiKey: apiKey,
      model: openaiConfig.model,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }),
      maxRetries: 3,
      retryDelay: 2000 // 2 seconds
    });

    // Add initialization for other AI services as needed
    
    console.log('AI services initialized successfully');
  } catch (error) {
    console.error('Error initializing AI services:', error);
    throw error; // Re-throw to allow handling in the component
  }
}
