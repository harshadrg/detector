import { useAuth } from '../context/useAuth.js';

/**
 * Hook to evaluate both global permissions and row-level capabilities.
 * Enforces capability-driven authorization without hardcoded roles.
 */
export function useCapabilities() {
  const { hasPermission, hasAnyPermission, user, isLoading } = useAuth();

  /**
   * Check if a specific resource grants a capability.
   * The backend resolves this based on ABAC ownership rules.
   */
  const hasCapability = (resource, capabilityCode) => {
    if (!resource || !Array.isArray(resource.capabilities)) return false;
    return resource.capabilities.includes(capabilityCode);
  };

  /**
   * Check if a specific resource grants at least one of the given capabilities.
   */
  const hasAnyCapability = (resource, capabilityCodes) => {
    if (!resource || !Array.isArray(resource.capabilities)) return false;
    return capabilityCodes.some((code) => resource.capabilities.includes(code));
  };

  return {
    hasPermission,       // Evaluates global permissions from /auth/me
    hasAnyPermission,    // Evaluates multiple global permissions
    hasCapability,       // Evaluates row-level resource capability
    hasAnyCapability,    // Evaluates multiple row-level resource capabilities
    isLoading,
    user
  };
}
