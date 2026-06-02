import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { IsString, IsEmail } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

export class ScoreOpenDto {
  @IsString()
  answerId: string;

  @IsString()
  isCorrect: string;
}

@Controller('candidates')
@UseGuards(AdminGuard)
export class CandidatesController {
  constructor(private candidatesService: CandidatesService) {}

  @Get()
  async findAll() {
    return this.candidatesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCandidateDto) {
    return this.candidatesService.create(dto.name, dto.email);
  }

  @Patch(':id/score-open')
  async scoreOpenQuestion(@Param('id') id: string, @Body() dto: ScoreOpenDto) {
    return this.candidatesService.scoreOpenQuestion(id, dto.answerId, dto.isCorrect === 'true');
  }
}
