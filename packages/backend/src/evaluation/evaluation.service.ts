import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EvaluationService {
  constructor(private prisma: PrismaService) {}

  async getEvaluation(token: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { token },
      include: { evaluation: true },
    });

    if (!candidate) throw new NotFoundException('Invalid evaluation link');

    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      status: candidate.status,
      evaluation: candidate.evaluation,
      startedAt: candidate.evaluation?.startedAt || null,
    };
  }

  async startEvaluation(token: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { token },
    });

    if (!candidate) throw new NotFoundException('Invalid evaluation link');
    if (candidate.status === 'COMPLETED') {
      throw new ForbiddenException('You have already completed this evaluation');
    }

    if (candidate.status === 'IN_PROGRESS') {
      const questions = await this.prisma.question.findMany({
        orderBy: { order: 'asc' },
      });
      const answers = await this.prisma.answer.findMany({
        where: { candidateId: candidate.id },
      });
      const evaluation = await this.prisma.evaluation.findUnique({
        where: { candidateId: candidate.id },
      });
      return { questions, answers, candidate, startedAt: evaluation?.startedAt || null };
    }

    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: 'IN_PROGRESS' },
    });

    await this.prisma.evaluation.create({
      data: {
        candidateId: candidate.id,
        scoreTotal: 0,
        categoryScores: {},
      },
    });

    const evaluation = await this.prisma.evaluation.findUnique({
      where: { candidateId: candidate.id },
    });

    const questions = await this.prisma.question.findMany({
      orderBy: { order: 'asc' },
    });

    return {
      questions,
      answers: [],
      candidate: { ...candidate, status: 'IN_PROGRESS' },
      startedAt: evaluation?.startedAt || null,
    };
  }

  async reportFocusLoss(token: string, lostAt: string, returnedAt: string, durationMs?: number) {
    const candidate = await this.prisma.candidate.findUnique({ where: { token } });
    if (!candidate) throw new NotFoundException('Invalid evaluation link');

    return this.prisma.focusEvent.create({
      data: {
        candidateId: candidate.id,
        lostAt: new Date(lostAt),
        returnedAt: new Date(returnedAt),
        durationMs: durationMs ?? null,
      },
    });
  }

  async submitAnswer(
    token: string,
    questionId: string,
    selectedAnswer?: string,
    textAnswer?: string,
  ) {
    const candidate = await this.prisma.candidate.findUnique({ where: { token } });
    if (!candidate) throw new NotFoundException('Invalid evaluation link');
    if (candidate.status === 'COMPLETED') {
      throw new ForbiddenException('Evaluation already completed');
    }

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    let isCorrect: boolean | null = null;
    if (question.type !== 'OPEN' && selectedAnswer) {
      isCorrect = selectedAnswer === question.correctAnswer;
    }

    const answer = await this.prisma.answer.upsert({
      where: {
        candidateId_questionId: {
          candidateId: candidate.id,
          questionId,
        },
      },
      update: {
        selectedAnswer: selectedAnswer ?? undefined,
        textAnswer: textAnswer ?? undefined,
        isCorrect,
      },
      create: {
        candidateId: candidate.id,
        questionId,
        selectedAnswer,
        textAnswer,
        isCorrect,
      },
    });

    return answer;
  }

  async submitEvaluation(token: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { token },
      include: {
        answers: { include: { question: true } },
        evaluation: true,
      },
    });

    if (!candidate) throw new NotFoundException('Invalid evaluation link');
    if (candidate.status === 'COMPLETED') {
      throw new ForbiddenException('Evaluation already completed');
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const categoryPoints: Record<string, { earned: number; total: number }> = {};

    for (const answer of candidate.answers) {
      const q = answer.question;
      totalPoints += q.points;

      if (!categoryPoints[q.category]) {
        categoryPoints[q.category] = { earned: 0, total: 0 };
      }
      categoryPoints[q.category].total += q.points;

      let correct = false;
      if (q.type !== 'OPEN' && answer.selectedAnswer) {
        correct = answer.selectedAnswer === q.correctAnswer;
        await this.prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect: correct },
        });
      } else if (answer.isCorrect === true) {
        correct = true;
      }

      if (correct) {
        earnedPoints += q.points;
        categoryPoints[q.category].earned += q.points;
      }
    }

    const scoreTotal = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : 0;

    const categoryScores: Record<string, number> = {};
    for (const [cat, pts] of Object.entries(categoryPoints)) {
      categoryScores[cat] = pts.total > 0
        ? Math.round((pts.earned / pts.total) * 100)
        : 0;
    }

    const focusEvents = await this.prisma.focusEvent.findMany({
      where: { candidateId: candidate.id },
    });

    const mcAnswers = candidate.answers.filter((a) => a.question.type !== 'OPEN');
    const openAnswers = candidate.answers.filter((a) => a.question.type === 'OPEN');
    const mcCorrect = mcAnswers.filter((a) => {
      if (a.isCorrect === true) return true;
      if (a.selectedAnswer && a.selectedAnswer === a.question.correctAnswer) return true;
      return false;
    }).length;
    const openAnswered = openAnswers.filter(
      (a) => a.textAnswer && a.textAnswer.length > 20,
    ).length;

    const focusLossCount = focusEvents.length;
    const totalFocusLossMs = focusEvents.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);

    const hasPerfectMc = mcAnswers.length > 0 && mcCorrect === mcAnswers.length;
    const hasPoorOpen = openAnswers.length > 0 && openAnswered < Math.ceil(openAnswers.length / 2);
    const hasExcessiveFocusLoss = focusLossCount >= 3 || totalFocusLossMs >= 30000;

    const suspicious = (hasPerfectMc && hasPoorOpen) || hasExcessiveFocusLoss;

    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        status: 'COMPLETED',
        scoreTotal,
        completedAt: new Date(),
        suspicious,
      },
    });

    if (candidate.evaluation) {
      await this.prisma.evaluation.update({
        where: { id: candidate.evaluation.id },
        data: {
          scoreTotal,
          categoryScores,
          completedAt: new Date(),
        },
      });
    }

    return { scoreTotal, categoryScores, suspicious };
  }
}
