import { useCapabilities } from '../hooks/useCapabilities.js';

/**
 * Component to conditionally render UI based on capabilities or permissions.
 * Evaluates Deny-by-Default architecture logic.
 *
 * @param {Object} props
 * @param {string} [props.permission] - Global permission required
 * @param {string[]} [props.anyPermission] - Any one of global permissions required
 * @param {Object} [props.resource] - The resource object containing `.capabilities` array for row-level checks
 * @param {string} [props.capability] - Row-level capability required on the resource
 * @param {string[]} [props.anyCapability] - Any one of row-level capabilities required on the resource
 * @param {React.ReactNode} [props.fallback=null] - Component to render if access is denied
 * @param {React.ReactNode} props.children - Component to render if access is granted
 */
export function RequireCapability({
  permission,
  anyPermission,
  resource,
  capability,
  anyCapability,
  fallback = null,
  children,
}) {
  const { hasPermission, hasAnyPermission, hasCapability, hasAnyCapability, isLoading } = useCapabilities();

  // If session is still determining state, don't show children OR fallback safely.
  if (isLoading) {
    return null;
  }

  // 1. Global single permission check
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // 2. Global multiple permissions check
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return fallback;
  }

  // 3. Row-level single capability check
  if (capability) {
    if (!resource || !hasCapability(resource, capability)) {
      return fallback;
    }
  }

  // 4. Row-level multiple capabilities check
  if (anyCapability) {
    if (!resource || !hasAnyCapability(resource, anyCapability)) {
      return fallback;
    }
  }

  return children;
}
