import cosine from "./cosine";

export function sum(input: any) {
  let sumValue = 0;
  for (let i = 0; i < (input?.length || 0); i++) {
    sumValue += input[i];
  }
  return sumValue;
}

export function mean(input: any) {
  return sum(input) / (input?.length || 1);
}

export default function pearson(a: any, b: any): number {
  if (!a || !b) return 0;

  const avgA = mean(a);
  const avgB = mean(b);

  const newA = new Array(a.length);
  const newB = new Array(b.length);
  for (let i = 0; i < newA.length; i++) {
    newA[i] = a[i] - avgA;
    newB[i] = b[i] - avgB;
  }

  return cosine(newA, newB);
}
