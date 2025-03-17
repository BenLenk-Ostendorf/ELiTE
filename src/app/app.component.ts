import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExamFormComponent } from "./exam-form/exam-form.component";
import { AIService } from './services/ai.service';
import { KeyReaderService } from './services/key-reader.service';
import { initializeAIServices } from './services/service-initializer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ExamFormComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ELiTE';
  initError: string | null = null;
  isInitialized = false;

  constructor(
    private aiService: AIService,
    private keyReader: KeyReaderService
  ) {}

  async ngOnInit() {
    // Initialize AI services
    try {
      await initializeAIServices(this.aiService, this.keyReader);
      console.log('AI services initialized successfully');
      this.isInitialized = true;
    } catch (error: any) {
      console.error('Failed to initialize AI services:', error);
      this.initError = error.message || 'Unknown error initializing AI services';
      this.isInitialized = false;
    }
  }
}
