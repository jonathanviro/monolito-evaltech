import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const candidates = await this.prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        evaluation: true,
        _count: { select: { answers: true } },
      },
    });

    const totalQuestions = await this.prisma.question.count();

    return candidates.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      token: c.token,
      status: c.status,
      scoreTotal: c.evaluation?.scoreTotal ?? null,
      suspicious: c.suspicious,
      createdAt: c.createdAt,
      completedAt: c.completedAt,
      answersCount: c._count.answers,
      totalQuestions,
      link: `/eval/${c.token}`,
    }));
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        evaluation: true,
        answers: {
          include: { question: true },
          orderBy: { question: { order: 'asc' } },
        },
        focusEvents: {
          orderBy: { lostAt: 'desc' },
        },
      },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');

    const totalQuestions = await this.prisma.question.count();
    const focusLossCount = candidate.focusEvents.length;
    const totalFocusLossMs = candidate.focusEvents.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);

    const { focusEvents, ...rest } = candidate;

    return {
      ...rest,
      totalQuestions,
      focusLossCount,
      totalFocusLossMs,
      focusEvents,
    };
  }

  async create(name: string, email: string) {
    const existing = await this.prisma.candidate.findUnique({ where: { email } });
    if (existing) throw new Error('Candidate with this email already exists');

    return this.prisma.candidate.create({
      data: { name, email },
      include: { evaluation: true },
    });
  }

  async scoreOpenQuestion(candidateId: string, answerId: string, isCorrect: boolean) {
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });

    if (!answer || answer.candidateId !== candidateId) {
      throw new NotFoundException('Answer not found');
    }

    await this.prisma.answer.update({
      where: { id: answerId },
      data: { isCorrect },
    });

    const answers = await this.prisma.answer.findMany({
      where: { candidateId },
      include: { question: true },
    });

    let totalPoints = 0;
    let earnedPoints = 0;
    const categoryPoints: Record<string, { earned: number; total: number }> = {};

    for (const a of answers) {
      const q = a.question;
      totalPoints += q.points;
      if (!categoryPoints[q.category]) {
        categoryPoints[q.category] = { earned: 0, total: 0 };
      }
      categoryPoints[q.category].total += q.points;

      let correct = false;
      if (q.type !== 'OPEN' && a.selectedAnswer) {
        correct = a.selectedAnswer === q.correctAnswer;
      } else if (a.isCorrect === true) {
        correct = true;
      }

      if (correct) {
        earnedPoints += q.points;
        categoryPoints[q.category].earned += q.points;
      }
    }

    const scoreTotal = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const categoryScores: Record<string, number> = {};
    for (const [cat, pts] of Object.entries(categoryPoints)) {
      categoryScores[cat] = pts.total > 0 ? Math.round((pts.earned / pts.total) * 100) : 0;
    }

    await this.prisma.evaluation.update({
      where: { candidateId },
      data: { scoreTotal, categoryScores },
    });

    return { scoreTotal, categoryScores };
  }
}
