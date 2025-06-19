import { AI_CONSTANTS, BUDGET_TIERS } from '../constant/ai';
import { ILead } from '../models/lead.model';

export class AIScoreCalculator {
  private static readonly MAX_SCORE = AI_CONSTANTS.MAX_SCORE;
  private static readonly BUDGET_TIERS = BUDGET_TIERS;

  private calculateBudgetScore(budget?: { min?: number; max?: number }): number {
    if (!budget?.max) {
      return 0;
    }
    const min = budget.min || 0;
    return this.normalizeValue(min, budget.max, budget.max);
  }

  private normalizeValue(min: number, max: number, value: number): number {
    if (max === min) {
      return 0;
    }
    return ((value - min) / (max - min)) * AIScoreCalculator.MAX_SCORE;
  }

  private simpleBudgetScoreBasedOnSlab(budget?: { value?: number }): number {
    if (!budget?.value) {
      return 0;
    }
    const tier = AIScoreCalculator.BUDGET_TIERS.find((t) => budget.value >= t.threshold);
    return tier?.score || 0;
  }

  public calculateScore(lead: ILead): number {
    // return this.calculateBudgetScore(lead.travelDetails?.budget);
    return this.simpleBudgetScoreBasedOnSlab(lead.travelDetails?.budget);
  }
}

export const aiScoreCalculator = new AIScoreCalculator();
