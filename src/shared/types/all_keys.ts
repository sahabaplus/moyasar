export type AllKeys<T> = {
  [K in keyof Required<T>]: unknown;
};
