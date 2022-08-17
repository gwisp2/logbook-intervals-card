export type IntersectTypes<X extends readonly any[]> = X extends readonly [head: infer H, ...tail: infer Tail]
  ? H & IntersectTypes<Tail>
  : {};
