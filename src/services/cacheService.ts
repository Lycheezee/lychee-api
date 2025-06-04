import NodeCache from "node-cache";
import { IUser } from "../models/user";
import { AuthUser } from "../types/user";

// Cache configuration: TTL of 1 hour (3600 seconds), check period every 10 minutes
const userCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  useClones: false,
});

export class CacheService {
  // Cache user by ID
  static setUser(userId: string, user: AuthUser | IUser): void {
    userCache.set(`user:${userId}`, user);
  }

  // Get user from cache by ID
  static getUser(userId: string): IUser | undefined {
    return userCache.get(`user:${userId}`);
  }

  // Remove user from cache
  static removeUser(userId: string): void {
    userCache.del(`user:${userId}`);
  }

  // Clear all cached users
  static clearAllUsers(): void {
    const keys = userCache.keys();
    const userKeys = keys.filter((key) => key.startsWith("user:"));
    userCache.del(userKeys);
  }

  // Get cache statistics
  static getStats() {
    return userCache.getStats();
  }

  // Check if user exists in cache
  static hasUser(userId: string): boolean {
    return userCache.has(`user:${userId}`);
  }
}

export default CacheService;
