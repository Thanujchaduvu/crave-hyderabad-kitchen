/**
 * AI Preparation Time Calculation Formula:
 * EstimatedPrep (mins) = max(BasePrep, (BasePrep + ActiveKitchenOrders * 1.8 + sum(ItemComplexity)) * PeakMultiplier)
 */
export interface PrepCalculationInput {
  basePrepMins: number;         // Outlet min prep time (e.g. 15 mins)
  activeKitchenOrdersCount: number; // Current orders in PREPARING status at this outlet
  itemComplexities: number[];   // Complexity weights (Biryani: 3.5, Haleem: 4.0, Sides: 0.5)
  orderTime?: Date;             // Placed timestamp
}

export function calculateAIPrepTime(input: PrepCalculationInput): {
  estPrepMins: number;
  promisedAt: Date;
} {
  const { basePrepMins, activeKitchenOrdersCount, itemComplexities, orderTime = new Date() } = input;

  // 1. Calculate item complexity sum
  const totalComplexity = itemComplexities.reduce((sum, weight) => sum + weight, 0);

  // 2. Kitchen queue congestion delay (1.8 minutes per active order)
  const queueDelay = activeKitchenOrdersCount * 1.8;

  // 3. Peak Hour Multiplier (Fri & Sun 20:00 - 22:00 IST peak dinner surge)
  const hyderabadParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(orderTime);
  const hours = Number(hyderabadParts.find((part) => part.type === 'hour')?.value ?? 0);
  const weekday = hyderabadParts.find((part) => part.type === 'weekday')?.value;
  const isFridayOrSunday = weekday === 'Fri' || weekday === 'Sun';
  const isPeakSurge = isFridayOrSunday && hours >= 20 && hours < 22;
  const peakMultiplier = isPeakSurge ? 1.35 : 1.0;

  // 4. Raw AI estimation
  const rawEstimate = (basePrepMins + queueDelay + totalComplexity) * peakMultiplier;

  // 5. Enforce Promise Floor Rule: max(AI_Estimate, Outlet_Min_Prep)
  const estPrepMins = Math.max(Math.ceil(rawEstimate), basePrepMins);
  const promisedAt = new Date(orderTime.getTime() + estPrepMins * 60000);

  return { estPrepMins, promisedAt };
}

/**
 * Checks if an active kitchen order is overdue past its promise time.
 * Guardrail: Orders >10 mins past promise trigger an emergency alert.
 */
export function checkOrderOverdueStatus(promisedAt: Date): {
  isOverdue: boolean;
  minutesLate: number;
} {
  const now = new Date();
  const diffMs = now.getTime() - new Date(promisedAt).getTime();
  const minutesLate = Math.floor(diffMs / 60000);

  return {
    isOverdue: minutesLate >= 10,
    minutesLate: Math.max(minutesLate, 0),
  };
}