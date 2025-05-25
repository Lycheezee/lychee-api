import UserContextService from "../services/userContextService";
import { IUser } from "../models/user";

/**
 * Utility functions to access current user information globally
 */
export class CurrentUser {
  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  static get(): IUser | null {
    return UserContextService.getCurrentUser();
  }

  /**
   * Get the current user's ID
   * @returns The current user ID or null if not authenticated
   */
  static getId(): string | null {
    return UserContextService.getCurrentUserId();
  }

  /**
   * Check if a user is currently authenticated
   * @returns True if user is authenticated, false otherwise
   */
  static isAuthenticated(): boolean {
    return UserContextService.getCurrentUser() !== null;
  }

  /**
   * Get the current user's email
   * @returns The current user's email or null if not authenticated
   */
  static getEmail(): string | null {
    const user = UserContextService.getCurrentUser();
    return user?.email || null;
  }

  /**
   * Get the current user's full name
   * @returns The current user's full name or null if not authenticated
   */
  static getFullName(): string | null {
    const user = UserContextService.getCurrentUser();
    if (!user) return null;

    const parts = [user.firstName, user.middleName, user.lastName].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join(" ") : null;
  }

  /**
   * Check if the current user has a specific diet plan
   * @returns True if user has a diet plan, false otherwise
   */
  static hasDietPlan(): boolean {
    const user = UserContextService.getCurrentUser();
    return !!user?.dietPlan;
  }

  /**
   * Get the current user's diet plan ID
   * @returns The diet plan ID or null if not authenticated or no diet plan
   */
  static getDietPlanId(): string | null {
    const user = UserContextService.getCurrentUser();
    return user?.dietPlan?.toString() || null;
  }
}

export default CurrentUser;
