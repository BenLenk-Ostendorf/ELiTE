import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AIService, AIRequest } from '../services/ai.service';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss']
})
export class ExamFormComponent {
  examQuestion: string = '';
  aiResponse: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private aiService: AIService) {}

  rateYourself() {
    if (!this.examQuestion || this.examQuestion.trim() === '') {
      this.errorMessage = 'Please enter an exam question first';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.aiResponse = '';

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
        this.errorMessage = `Failed to get AI response: ${error.message}`;
        this.isLoading = false;
      }
    });
  }
}
