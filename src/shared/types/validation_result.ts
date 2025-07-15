export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}