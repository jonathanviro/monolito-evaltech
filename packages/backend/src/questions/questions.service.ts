import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.question.findMany({
      orderBy: { order: 'asc' },
    });
  }
}
