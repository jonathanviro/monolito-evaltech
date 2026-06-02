import {
  Controller, Get, Post, Patch, Param, Body,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { IsString, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsOptional()
  @IsString()
  selectedAnswer?: string;

  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class FocusLossDto {
  @IsString()
  lostAt: string;

  @IsString()
  returnedAt: string;

  @IsOptional()
  durationMs?: number;
}

@Controller('evaluation')
export class EvaluationController {
  constructor(private evaluationService: EvaluationService) {}

  @Get(':token')
  async getEvaluation(@Param('token') token: string) {
    return this.evaluationService.getEvaluation(token);
  }

  @Post(':token/start')
  async startEvaluation(@Param('token') token: string) {
    return this.evaluationService.startEvaluation(token);
  }

  @Post(':token/answer')
  async submitAnswer(@Param('token') token: string, @Body() dto: SubmitAnswerDto) {
    return this.evaluationService.submitAnswer(
      token,
      dto.questionId,
      dto.selectedAnswer,
      dto.textAnswer,
    );
  }

  @Post(':token/focus-loss')
  async reportFocusLoss(@Param('token') token: string, @Body() dto: FocusLossDto) {
    return this.evaluationService.reportFocusLoss(token, dto.lostAt, dto.returnedAt, dto.durationMs);
  }

  @Patch(':token/submit')
  async submitEvaluation(@Param('token') token: string) {
    return this.evaluationService.submitEvaluation(token);
  }
}
