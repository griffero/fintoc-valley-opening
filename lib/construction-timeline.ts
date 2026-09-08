export const TITLE_STAGES = [
  [
    [3.94, 5.4, 5.64],
    [4.02, 5.3, 5.5],
    [4.5, 5.89, 6.15],
    [4.71, 6.03, 6.31],
    [4.96, 6.28, 6.58],
    [4.03, 5.44, 5.74],
    [4.15, 5.6, 5.95],
  ],
  [
    [5.35, 6.86, 7.13],
    [5.56, 6.74, 6.98],
    [5.45, 6.5, 6.76],
    [5.63, 6.87, 7.11],
    [5.48, 6.9, 7.18],
    [5.18, 6.82, 7.03],
  ],
] as const;

/** Two construction fronts converge; the last row resolves just before the hold. */
export function constructionStage(
  row: number,
  index: number,
  length: number,
  floors: number,
) {
  const stages = TITLE_STAGES[row as 0 | 1];
  const key = Math.round(
    (index * (stages.length - 1)) / Math.max(1, length - 1),
  );
  const [steel, topFloor, roof] = stages[key];
  return {
    steel,
    roof,
    foundation: Math.max(3.78, steel - 0.12),
    floors: Array.from({ length: floors }, (_, level) => {
      const p = level / Math.max(1, floors - 1);
      return steel + 0.18 + (topFloor - steel - 0.18) * p;
    }),
  };
}

export type CraneDelivery = {
  time: number;
  target: [number, number, number];
  row: number;
  index: number;
  roof: boolean;
};
