import { connectDB } from '@/lib/mongodb';
import Trade from '@/lib/models/Trade';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PortfolioService } from '@/lib/services/portfolioService';
import { logger } from '@/lib/utils/logger';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { JWTPayload, Holding } from '@/lib/types';

const log = logger.child({ module: 'DashboardRoute' });

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as JWTPayload | null;

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const portfolio = await PortfolioService.getPortfolio(decoded.userId);

    const trades = await Trade.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const totalPortfolioValue = portfolio.accountBalance + 
      (portfolio.holdings?.reduce((sum: number, h: Holding) => sum + (h.totalValue || 0), 0) || 0);

    return NextResponse.json(
      {
        portfolio: {
          accountBalance: portfolio.accountBalance,
          totalPortfolioValue,
          totalInvested: portfolio.totalInvested,
          totalReturns: portfolio.totalReturns,
          holdings: portfolio.holdings || [],
        },
        trades,
        stats: {
          totalHoldings: portfolio.holdings?.length || 0,
          totalTrades: trades.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    log.error({ error }, 'Dashboard API error');
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
