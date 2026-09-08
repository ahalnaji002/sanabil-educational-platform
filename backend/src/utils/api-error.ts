export type ErrorFields = Record<string, string>;
export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly errors?: ErrorFields) {
    super(message);
    this.name = "ApiError";
  }
}
