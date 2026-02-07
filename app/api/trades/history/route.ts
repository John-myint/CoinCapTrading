import { connectDB } from '@/lib/mongodb';
import TimedTrade from '@/lib/models/TimedTrade';
import Trade from '@/lib/models/Trade';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextAuth';
import { withRateLimit } from '@/lib/middleware/rateLimit';

export const dynamic = 'force-dynamic';

// GET /api/trades/history?page=1&limit=20&type=all
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20));
    const typeFilter = request.nextUrl.searchParams.get('type') || 'all';
    const skip = (page - 1) * limit;

    // Fetch timed trades
    const timedQuery: any = { userId: session.user.id };
    if (typeFilter === 'buy' || typeFilter === 'sell') {
      timedQuery.type = typeFilter;
    }

    const [timedTrades, timedTotal] = await Promise.all([
      TimedTrade.find(timedQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TimedTrade.countDocuments(timedQuery),
    ]);

    // Also get regular trades
    const regularQuery: any = { userId: session.user.id };
    if (typeFilter === 'buy' || typeFilter === 'sell') {
      regularQuery.type = typeFilter;
    }

    const [regularTrades, regularTotal] = await Promise.all([
      Trade.find(regularQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Trade.countDocuments(regularQuery),
    ]);

    // Merge and sort all trades
    const allTrades = [
      ...timedTrades.map((t: any) => ({
        id: t._id.toString(),
        type: t.type,
        cryptoSymbol: t.cryptoSymbol,
        amount: t.amount,
        entryPrice: t.amount, // For timed trades the amount IS the entry
        exitPrice: t.result === 'win' ? t.amount + t.profitAmount : t.result === 'lose' ? 0 : null,
        profitLoss: t.result === 'win' ? t.profitAmount : t.result === 'lose' ? -t.amount : 0,
        profitPercent: t.profitPercent,
        status: t.result,
        period: t.period,
        tradeKind: 'timed' as const,
        transactionId: t.transactionId,
        createdAt: t.createdAt,
        resolvedAt: t.resolvedAt,
      })),
      ...regularTrades.map((t: any) => ({
        id: t._id.toString(),
        type: t.type,
        cryptoSymbol: t.cryptoSymbol,
        amount: t.amount,
        entryPrice: t.pricePerUnit,
        exitPrice: null,
        profitLoss: 0,
        profitPercent: 0,
        status: 'completed',
        period: null,
        tradeKind: 'spot' as const,
        transactionId: t.transactionId,
        createdAt: t.createdAt,
        resolvedAt: null,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    const totalItems = timedTotal + regularTotal;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      trades: allTrades,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
