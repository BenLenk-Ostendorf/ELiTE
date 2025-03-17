import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExamFormComponent } from "./exam-form/exam-form.component";
import { AIService } from './services/ai.service';
import { initializeAIServices } from './services/service-initializer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ExamFormComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ELiTE';

  constructor(private aiService: AIService) {}

  ngOnInit() {
    // Initialize AI services
    initializeAIServices(this.aiService)();
  }
}
