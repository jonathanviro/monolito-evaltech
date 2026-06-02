import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CandidatesModule } from './candidates/candidates.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { QuestionsModule } from './questions/questions.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, CandidatesModule, EvaluationModule, QuestionsModule, AdminModule],
})
export class AppModule {}
