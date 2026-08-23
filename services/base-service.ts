export abstract class BaseService {
  protected static handleError(error: unknown): never {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}
