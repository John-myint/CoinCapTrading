import mongoose from 'mongoose';
import Portfolio from '@/lib/models/Portfolio';
import Trade from '@/lib/models/Trade';
import config from '@/lib/config';
import { logger } from '@/lib/utils/logger';
import Decimal from 'decimal.js';
import { nanoid } from 'nanoid';

const log = logger.child({ module: 'PortfolioService' });

interface TradeInput {
  type: 'buy' | 'sell';
  cryptoSymbol: string;
  amount: number;
  pricePerUnit: number;
}

interface TradeResult {
  trade: any;
  portfolio: any;
}

export class PortfolioService {
  static async executeTrade(userId: string, tradeInput: TradeInput): Promise<TradeResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { type, cryptoSymbol, amount, pricePerUnit } = tradeInput;
      
      const totalValue = new Decimal(amount).mul(pricePerUnit).toNumber();

      let portfolio = await Portfolio.findOne({ userId }).session(session);

      if (!portfolio) {
        portfolio = new Portfolio({
          userId,
          accountBalance: config.app.defaultBalance,
          totalInvested: 0,
          totalReturns: 0,
          holdings: [],
        });
      }

      if (type === 'buy') {
        await this.executeBuy(portfolio, cryptoSymbol, amount, pricePerUnit, totalValue);
      } else {
        await this.executeSell(portfolio, cryptoSymbol, amount, pricePerUnit, totalValue);
      }

      await portfolio.save({ session });

      const trade = new Trade({
        userId,
        type,
        cryptoSymbol,
        amount,
        pricePerUnit,
        totalValue,
        status: 'completed',
        transactionId: `TXN${nanoid(16)}`,
      });

      await trade.save({ session });

      await session.commitTransaction();

      log.info({ userId, type, cryptoSymbol, amount, totalValue }, 'Trade executed successfully');

      return { trade, portfolio };
    } catch (error) {
      await session.abortTransaction();
      log.error({ error, userId, tradeInput }, 'Trade execution failed');
      throw error;
    } finally {
      session.endSession();
    }
  }

  private static executeBuy(
    portfolio: any,
    cryptoSymbol: string,
    amount: number,
    pricePerUnit: number,
    totalValue: number
  ): void {
    const accountBalance = new Decimal(portfolio.accountBalance);
    const totalValueDecimal = new Decimal(totalValue);

    if (accountBalance.lessThan(totalValueDecimal)) {
      throw new Error('Insufficient funds');
    }

    portfolio.accountBalance = accountBalance.minus(totalValueDecimal).toNumber();

    const existingHolding = portfolio.holdings?.find(
      (h: any) => h.cryptoSymbol === cryptoSymbol
    );

    if (existingHolding) {
      const existingAmount = new Decimal(existingHolding.amount);
      const existingAvgPrice = new Decimal(existingHolding.averageBuyPrice);
      const newAmount = new Decimal(amount);
      const newPrice = new Decimal(pricePerUnit);

      const totalAmount = existingAmount.plus(newAmount);
      const newAverageBuyPrice = existingAmount
        .mul(existingAvgPrice)
        .plus(newAmount.mul(newPrice))
        .div(totalAmount);

      existingHolding.amount = totalAmount.toNumber();
      existingHolding.averageBuyPrice = newAverageBuyPrice.toNumber();
      existingHolding.currentPrice = pricePerUnit;
      existingHolding.totalValue = totalAmount.mul(newPrice).toNumber();
      
      const gainLoss = totalAmount.mul(newPrice.minus(newAverageBuyPrice));
      existingHolding.gainLoss = gainLoss.toNumber();
      const costBasis = totalAmount.mul(newAverageBuyPrice);
      existingHolding.gainLossPercent = costBasis.isZero()
        ? 0
        : gainLoss.div(costBasis).mul(100).toNumber();
    } else {
      portfolio.holdings.push({
        cryptoSymbol,
        amount,
        averageBuyPrice: pricePerUnit,
        currentPrice: pricePerUnit,
        totalValue,
        gainLoss: 0,
        gainLossPercent: 0,
      });
    }

    portfolio.totalInvested = new Decimal(portfolio.totalInvested || 0)
      .plus(totalValue)
      .toNumber();
  }

  private static executeSell(
    portfolio: any,
    cryptoSymbol: string,
    amount: number,
    pricePerUnit: number,
    totalValue: number
  ): void {
    const existingHolding = portfolio.holdings?.find(
      (h: any) => h.cryptoSymbol === cryptoSymbol
    );

    if (!existingHolding) {
      throw new Error('Crypto asset not found in portfolio');
    }

    const existingAmount = new Decimal(existingHolding.amount);
    const sellAmount = new Decimal(amount);

    if (existingAmount.lessThan(sellAmount)) {
      throw new Error('Insufficient crypto balance');
    }

    portfolio.accountBalance = new Decimal(portfolio.accountBalance)
      .plus(totalValue)
      .toNumber();

    const remainingAmount = existingAmount.minus(sellAmount);

    if (remainingAmount.isZero()) {
      portfolio.holdings = portfolio.holdings.filter(
        (h: any) => h.cryptoSymbol !== cryptoSymbol
      );
    } else {
      existingHolding.amount = remainingAmount.toNumber();
      existingHolding.currentPrice = pricePerUnit;
      
      const avgPrice = new Decimal(existingHolding.averageBuyPrice);
      const newPrice = new Decimal(pricePerUnit);
      const newTotalValue = remainingAmount.mul(newPrice);
      
      existingHolding.totalValue = newTotalValue.toNumber();
      
      const gainLoss = remainingAmount.mul(newPrice.minus(avgPrice));
      existingHolding.gainLoss = gainLoss.toNumber();
      existingHolding.gainLossPercent = remainingAmount.mul(avgPrice).isZero()
        ? 0
        : gainLoss.div(remainingAmount.mul(avgPrice)).mul(100).toNumber();
    }

    const sellCostBasisFinal = new Decimal(existingHolding.averageBuyPrice).mul(amount);
    const profit = new Decimal(totalValue).minus(sellCostBasisFinal);
    
    portfolio.totalReturns = new Decimal(portfolio.totalReturns || 0)
      .plus(profit)
      .toNumber();
  }

  static async getPortfolio(userId: string): Promise<any> {
    try {
      let portfolio = await Portfolio.findOne({ userId });

      if (!portfolio) {
        portfolio = new Portfolio({
          userId,
          accountBalance: config.app.defaultBalance,
          totalInvested: 0,
          totalReturns: 0,
          holdings: [],
        });
        await portfolio.save();
      }

      return portfolio;
    } catch (error) {
      log.error({ error, userId }, 'Failed to get portfolio');
      throw error;
    }
  }

  static async updateHoldingPrices(userId: string, prices: Record<string, number>): Promise<any> {
    try {
      const portfolio = await Portfolio.findOne({ userId });

      if (!portfolio || !portfolio.holdings) {
        return portfolio;
      }

      let hasChanges = false;

      for (const holding of portfolio.holdings) {
        const newPrice = prices[holding.cryptoSymbol];
        
        if (newPrice && newPrice !== holding.currentPrice) {
          holding.currentPrice = newPrice;
          
          const amount = new Decimal(holding.amount);
          const avgPrice = new Decimal(holding.averageBuyPrice);
          const currentPrice = new Decimal(newPrice);
          
          holding.totalValue = amount.mul(currentPrice).toNumber();
          
          const gainLoss = amount.mul(currentPrice.minus(avgPrice));
          holding.gainLoss = gainLoss.toNumber();
          const holdingCostBasis = amount.mul(avgPrice);
          holding.gainLossPercent = holdingCostBasis.isZero()
            ? 0
            : gainLoss.div(holdingCostBasis).mul(100).toNumber();
          
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await portfolio.save();
      }

      return portfolio;
    } catch (error) {
      log.error({ error, userId }, 'Failed to update holding prices');
      throw error;
    }
  }
}
