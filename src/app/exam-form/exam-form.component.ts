import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AIService, AIRequest } from '../services/ai.service';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './exam-form.component.html',
  styleUrl: './exam-form.component.scss'
})
export class ExamFormComponent {
  examQuestion: string = '';
  aiResponse: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  isSubmitted: boolean = false;
  retryCount: number = 0;
  maxRetries: number = 3;

  constructor(private aiService: AIService) {}

  rateYourself() {
    if (!this.examQuestion || this.examQuestion.trim() === '') {
      this.errorMessage = 'Please enter an exam question first';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.aiResponse = '';
    this.isSubmitted = true; // Mark as submitted to make question uneditable
    this.retryCount = 0;

    this.sendRequest();
  }

  private sendRequest() {
    const request: AIRequest = {
      question: this.examQuestion,
      options: {
        temperature: 0.7,
        maxTokens: 1000
      }
    };

    this.aiService.sendQuestion('openai', request).subscribe({
      next: (response) => {
        this.aiResponse = response.content;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting AI response:', error);
        
        // Check if it's a rate limit error
        if (error.message && error.message.includes('Rate limit exceeded')) {
          this.handleRateLimitError();
        } else {
          // For other errors, just display the message
          this.errorMessage = this.formatErrorMessage(error.message);
          this.isLoading = false;
        }
      }
    });
  }

  private handleRateLimitError() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const waitTime = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
      
      this.errorMessage = `Rate limit exceeded. Retrying in ${waitTime / 1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`;
      
      setTimeout(() => {
        this.errorMessage = `Retrying... (Attempt ${this.retryCount}/${this.maxRetries})`;
        this.sendRequest();
      }, waitTime);
    } else {
      this.errorMessage = 'Rate limit exceeded. Please try again later.';
      this.isLoading = false;
    }
  }

  private formatErrorMessage(message: string): string {
    // Extract the most relevant part of the error message
    if (message.includes('Failed to get response from openai:')) {
      return message.split('Failed to get response from openai:')[1].trim();
    }
    
    if (message.includes('Failed to get AI response:')) {
      return message.split('Failed to get AI response:')[1].trim();
    }
    
    return message;
  }
  
  // Reset the form to allow a new question
  resetForm() {
    this.examQuestion = '';
    this.aiResponse = '';
    this.errorMessage = '';
    this.isSubmitted = false;
    this.retryCount = 0;
  }
}
