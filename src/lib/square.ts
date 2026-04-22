import "server-only";
import { SquareClient, SquareEnvironment } from "square";

// Lazy initialization — don't throw at module load time (breaks Next.js build)
let _client: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (!_client) {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    if (!token) {
      throw new Error("SQUARE_ACCESS_TOKEN environment variable is required");
    }
    _client = new SquareClient({
      token,
      environment: SquareEnvironment.Production,
    });
  }
  return _client;
}

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID ?? "";
