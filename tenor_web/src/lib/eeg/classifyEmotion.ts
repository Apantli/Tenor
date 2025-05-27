import type { EEGDataPointWithTimestamp } from "~/app/(logged)/project/[projectId]/retrospective/ConversationPopup";

type EmotionClassificationResult = {
  emotion: "relaxed" | "happy" | "stressed" | "angry" | "neutral";
  features: Record<"delta" | "theta" | "alpha" | "beta" | "gamma", number>;
};

export function classifyEmotion(
  data: EEGDataPointWithTimestamp[],
): EmotionClassificationResult {
  const bands = ["delta", "theta", "alpha", "beta", "gamma"] as const;

  const bandVals: Record<(typeof bands)[number], number[]> = {
    delta: [],
    theta: [],
    alpha: [],
    beta: [],
    gamma: [],
  };

  // Flatten all values across the data points
  for (const entry of data) {
    for (const band of bands) {
      bandVals[band].push(...entry[band]);
    }
  }

  // Compute averages
  const avg: EmotionClassificationResult["features"] = {
    delta: average(bandVals.delta),
    theta: average(bandVals.theta),
    alpha: average(bandVals.alpha),
    beta: average(bandVals.beta),
    gamma: average(bandVals.gamma),
  };

  const { delta, theta, alpha, beta, gamma } = avg;

  // Heuristic-based emotion classification
  let emotion: EmotionClassificationResult["emotion"];
  if (alpha > beta * 1.2 && gamma < 0.5) {
    emotion = "relaxed";
  } else if (alpha > beta && gamma >= 0.5) {
    emotion = "happy";
  } else if (beta > alpha * 1.5 && gamma > 0.6) {
    emotion = "stressed";
  } else if (beta > alpha && gamma > 0.5 && (delta > 1.0 || theta > 1.0)) {
    emotion = "angry";
  } else {
    emotion = "neutral";
  }

  return { emotion, features: avg };
}

// Helper function
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) {
    return undefined;
  }

  const frequency = new Map<T, number>();

  for (const item of arr) {
    frequency.set(item, (frequency.get(item) ?? 0) + 1);
  }

  let maxItem: T = arr[0]!;
  let maxCount = 0;

  for (const [item, count] of frequency.entries()) {
    if (count > maxCount) {
      maxItem = item;
      maxCount = count;
    }
  }

  return maxItem;
}
