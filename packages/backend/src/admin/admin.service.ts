import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const total = await this.prisma.candidate.count();
    const completed = await this.prisma.candidate.count({ where: { status: 'COMPLETED' } });
    const inProgress = await this.prisma.candidate.count({ where: { status: 'IN_PROGRESS' } });
    const pending = await this.prisma.candidate.count({ where: { status: 'PENDING' } });
    const suspicious = await this.prisma.candidate.count({ where: { suspicious: true } });

    const evaluations = await this.prisma.evaluation.findMany({
      where: { scoreTotal: { not: null } },
      select: { scoreTotal: true },
    });

    const avgScore = evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.scoreTotal || 0), 0) / evaluations.length)
      : 0;

    return { total, completed, inProgress, pending, suspicious, avgScore };
  }
}
