import { AsyncLocalStorage } from "async_hooks";
import { IUser } from "../models/user";

interface UserContext {
  currentUser: IUser | null;
  userId: string | null;
}

// Create an AsyncLocalStorage instance for user context
const userContextStorage = new AsyncLocalStorage<UserContext>();

export class UserContextService {
  // Set the current user context
  static setContext(user: IUser): void {
    const context = userContextStorage.getStore();
    if (context) {
      context.currentUser = user;
      context.userId = user._id.toString();
    }
  }

  // Get the current user from context
  static getCurrentUser(): IUser | null {
    const context = userContextStorage.getStore();
    return context?.currentUser || null;
  }

  // Get the current user ID from context
  static getCurrentUserId(): string | null {
    const context = userContextStorage.getStore();
    return context?.userId || null;
  }

  // Run code within a user context
  static runWithContext<T>(user: IUser | null, callback: () => T): T {
    const context: UserContext = {
      currentUser: user,
      userId: user?._id.toString() || null,
    };
    return userContextStorage.run(context, callback);
  }

  // Check if user context exists
  static hasContext(): boolean {
    return userContextStorage.getStore() !== undefined;
  }

  // Clear the current context
  static clearContext(): void {
    const context = userContextStorage.getStore();
    if (context) {
      context.currentUser = null;
      context.userId = null;
    }
  }
}

export default UserContextService;
