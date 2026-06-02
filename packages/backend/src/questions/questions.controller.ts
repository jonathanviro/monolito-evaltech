import { Controller, Get, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.questionsService.findAll();
  }
}
