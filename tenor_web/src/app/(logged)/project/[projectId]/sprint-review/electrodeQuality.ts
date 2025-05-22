export type ChannelPowerData = [number, number, number, number, number]; // [Delta, Theta, Alpha, Beta, Gamma]

export type ElectrodeQualityValue =
  | "N/A"
  | "Calibrating..."
  | "Disconnected/No Signal"
  | "Very Noisy (Poor Contact)"
  | "High Low-Freq Noise (Interference)"
  | "High Gamma Noise (Muscle/Interference)"
  | "Good";

export type ElectrodeQualityState = {
  [key: string]: ElectrodeQualityValue;
};

export interface PowerHistoryEntry {
  delta: number[];
  theta: number[];
  alpha: number[];
  beta: number[];
  gamma: number[];
  total: number[];
}

export type PowerHistory = Record<string, PowerHistoryEntry>;

// Assuming standard Muse 2 electrode names
export const electrodeNames: string[] = ["TP9", "AF7", "AF8", "TP10"];

// Helper function to calculate average of an array
const avg = (arr: number[]): number =>
  arr.reduce((sum, val) => sum + val, 0) / arr.length;

// --- Configuration for Heuristics ---
const HISTORY_SIZE = 5; // Number of FFT epochs to average over.

// Thresholds for detecting "Disconnected/No Signal"
const ABS_MIN_TOTAL_POWER_THRESHOLD = 0.0000000001; // Very low, indicative of almost no signal
const ZERO_SIGNAL_CHECK_THRESHOLD = 1e-9; // A slightly higher threshold to catch near-zero signals

// Thresholds for detecting "Noisy/Poor Contact"
const MAX_AVG_TOTAL_POWER_THRESHOLD = 800; // Total power across all bands.
const DELTA_THETA_RATIO_THRESHOLD = 0.85; // Ratio of (Delta+Theta) power to Total power.
const MAX_AVG_GAMMA_THRESHOLD = 150; // Max Gamma power.

// --- Function Factory for History and Inference ---
// This function creates and returns an `inferElectrodeQuality` function
// and a `resetHistory` function, both of which close over the `powerHistory` state.
export function createElectrodeQualityInferer() {
  const powerHistory: PowerHistory = {};

  // Initialize history for all electrodes
  electrodeNames.forEach((name) => {
    powerHistory[name] = {
      delta: [],
      theta: [],
      alpha: [],
      beta: [],
      gamma: [],
      total: [],
    };
  });

  /**
   * Resets the accumulated power history for all electrodes.
   * Call this when the Muse device disconnects or a new session starts.
   */
  const resetHistory = (): void => {
    electrodeNames.forEach((name) => {
      powerHistory[name] = {
        delta: [],
        theta: [],
        alpha: [],
        beta: [],
        gamma: [],
        total: [],
      };
    });
  };

  /**
   * Updates the power history for a specific channel and returns the averaged values.
   * This is an internal helper used by inferElectrodeQuality.
   */
  const updateAndGetAverages = (
    channelPowerData: ChannelPowerData,
    channelName: string,
  ): {
    avgDelta: number;
    avgTheta: number;
    avgAlpha: number;
    avgBeta: number;
    avgGamma: number;
    avgTotalPower: number;
    hasEnoughHistory: boolean;
  } => {
    const [delta, theta, alpha, beta, gamma] = channelPowerData;
    const currentTotalPower = delta + theta + alpha + beta + gamma;
    const history = powerHistory[channelName]!;

    // Update history
    history.delta.push(delta);
    history.theta.push(theta);
    history.alpha.push(alpha);
    history.beta.push(beta);
    history.gamma.push(gamma);
    history.total.push(currentTotalPower);

    // Keep history size constrained
    if (history.delta.length > HISTORY_SIZE) {
      history.delta.shift();
      history.theta.shift();
      history.alpha.shift();
      history.beta.shift();
      history.gamma.shift();
      history.total.shift();
    }

    const hasEnoughHistory = history.total.length === HISTORY_SIZE;

    return {
      avgDelta: avg(history.delta),
      avgTheta: avg(history.theta),
      avgAlpha: avg(history.alpha),
      avgBeta: avg(history.beta),
      avgGamma: avg(history.gamma),
      avgTotalPower: avg(history.total),
      hasEnoughHistory: hasEnoughHistory,
    };
  };

  /**
   * Infers the contact quality of a single electrode based on its FFT power band data
   * and the accumulated history.
   * @param channelPowerData - An array representing [Delta, Theta, Alpha, Beta, Gamma] power for the channel.
   * @param channelName - The name of the electrode (e.g., 'TP9', 'AF7').
   * @returns An ElectrodeQualityValue string ('Good', 'Very Noisy', etc.).
   */
  const inferElectrodeQuality = (
    channelPowerData: ChannelPowerData,
    channelName: string,
  ): ElectrodeQualityValue => {
    const {
      avgDelta,
      avgTheta,
      avgAlpha,
      avgBeta,
      avgGamma,
      avgTotalPower,
      hasEnoughHistory,
    } = updateAndGetAverages(channelPowerData, channelName);

    // If we don't have enough history yet, consider it 'Calibrating'
    if (!hasEnoughHistory) {
      return "Calibrating...";
    }

    // --- Refined Heuristics for determining quality ---

    // 1. **Disconnected/Very Weak Signal**: If total power is extremely low or near zero.
    if (
      avgTotalPower < ZERO_SIGNAL_CHECK_THRESHOLD ||
      (avgDelta < ABS_MIN_TOTAL_POWER_THRESHOLD &&
        avgTheta < ABS_MIN_TOTAL_POWER_THRESHOLD &&
        avgAlpha < ABS_MIN_TOTAL_POWER_THRESHOLD &&
        avgBeta < ABS_MIN_TOTAL_POWER_THRESHOLD &&
        avgGamma < ABS_MIN_TOTAL_POWER_THRESHOLD)
    ) {
      return "Disconnected/No Signal";
    }

    // 2. **Excessively High Broadband Noise (e.g., lifted electrode, strong interference)**:
    if (avgTotalPower > MAX_AVG_TOTAL_POWER_THRESHOLD) {
      return "Very Noisy (Poor Contact)";
    }

    // 3. **Dominance of Low Frequencies (Delta/Theta) due to noise**:
    const avgDeltaThetaPower = avgDelta + avgTheta;
    if (
      avgTotalPower > 0 &&
      avgDeltaThetaPower / avgTotalPower > DELTA_THETA_RATIO_THRESHOLD
    ) {
      return "High Low-Freq Noise (Interference)";
    }

    // 4. **Excessive Gamma Power (often muscle artifact or high-frequency electrical noise)**:
    if (avgGamma > MAX_AVG_GAMMA_THRESHOLD) {
      return "High Gamma Noise (Muscle/Interference)";
    }

    // If none of the "bad" conditions are met, it's "Good"
    return "Good";
  };

  return { inferElectrodeQuality, resetHistory };
}
