import { pipe } from "rxjs";
import { map } from "rxjs/operators";

export const sum = (array: number[]) => {
  let num = 0;
  for (let i = 0, l = array.length; i < l; i++) {
    num += array[i]!;
  }
  return num;
};

export const mean = (array: number[]): number => sum(array) / array.length;

export const variance = (array: number[]) => {
  const arrayMean = mean(array);
  return mean(array.map((num) => Math.pow(num - arrayMean, 2)));
};

export const standardDeviation = (array: number[]) => {
  const res = Math.sqrt(variance(array));
  return res;
};

const defaultDataProp: string = "data";

/**
 * @method addSignalQuality
 * Adds a signal quality property to a stream of Epochs
 * signal quality is represented as standard deviation value for each channel
 * @example eeg$.pipe(addSignalQuality())
 * @param {Object} options - addSignalQuality options
 * @param {string} [options.dataProp='data] Name of key associated with eeg data
 * @returns {Observable<Epoch>}
 */
export const addSignalQuality = ({ dataProp = defaultDataProp } = {}) =>
  pipe(
    // @ts-ignore
    map((epoch: any) => {
      // console.log("epoch", epoch);
      const names = epoch.info.channelNames
        ? epoch.info.channelNames
        : epoch[dataProp].map((_: any, i: number) => i);
      return {
        ...epoch,
        signalQuality: epoch[dataProp].reduce(
          (acc: any, curr: any, index: any) => {
            return {
              ...acc,
              [names[index]]: standardDeviation(curr),
            };
          },
          {},
        ),
      };
    }),
  );
