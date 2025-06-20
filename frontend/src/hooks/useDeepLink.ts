import { useMemo } from 'react';
import { useUrlState } from './useUrlState';
import { useLeadsUrlState } from './useLeadsUrlState';

export interface DeepLinkOptions {
  /**
   * Base route path
   */
  basePath: string;

  /**
   * URL state configuration
   */
  urlStateConfig: any;

  /**
   * Additional query parameters
   */
  additionalParams?: Record<string, string | number | boolean>;

  /**
   * Whether to include current URL state
   */
  includeCurrentState?: boolean;
}

export interface UseDeepLinkReturn {
  /**
   * Generate a deep link URL with current state
   */
  generateUrl: (overrides?: Record<string, any>) => string;

  /**
   * Generate a shareable URL
   */
  generateShareableUrl: (overrides?: Record<string, any>) => string;

  /**
   * Copy current URL to clipboard
   */
  copyCurrentUrl: () => Promise<void>;

  /**
   * Get current URL with state
   */
  getCurrentUrl: () => string;
}

/**
 * A utility hook for creating deep-linkable URLs throughout the project.
 *
 * This hook provides functions to generate URLs that include all current
 * state parameters, making them perfect for sharing, bookmarking, and
 * programmatic navigation.
 *
 * @example
 * ```tsx
 * const { generateUrl, copyCurrentUrl } = useDeepLink({
 *   basePath: '/crm/leads',
 *   urlStateConfig: leadsUrlState
 * });
 *
 * // Generate URL with current state
 * const url = generateUrl();
 *
 * // Generate URL with overrides
 * const filteredUrl = generateUrl({ status: 'new', page: 1 });
 *
 * // Copy current URL to clipboard
 * await copyCurrentUrl();
 * ```
 */
export function useDeepLink(options: DeepLinkOptions): UseDeepLinkReturn {
  const {
    basePath,
    urlStateConfig,
    additionalParams = {},
    includeCurrentState = true,
  } = options;

  // Get current URL state if needed
  const currentState = includeCurrentState
    ? urlStateConfig.getUrlParams?.() || {}
    : {};

  const generateUrl = useMemo(() => {
    return (overrides: Record<string, any> = {}) => {
      const params = new URLSearchParams();

      // Add current state
      Object.entries(currentState).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      // Add additional params
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      // Add overrides (these will override current state)
      Object.entries(overrides).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      return `${basePath}${queryString ? `?${queryString}` : ''}`;
    };
  }, [basePath, currentState, additionalParams]);

  const generateShareableUrl = useMemo(() => {
    return (overrides: Record<string, any> = {}) => {
      const url = generateUrl(overrides);
      return `${window.location.origin}${url}`;
    };
  }, [generateUrl]);

  const copyCurrentUrl = async () => {
    try {
      const url = getCurrentUrl();
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getCurrentUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const getCurrentUrl = () => {
    return generateShareableUrl();
  };

  return {
    generateUrl,
    generateShareableUrl,
    copyCurrentUrl,
    getCurrentUrl,
  };
}

/**
 * A specialized hook for leads deep linking
 */
export function useLeadsDeepLink() {
  const leadsUrlState = useLeadsUrlState();

  return useDeepLink({
    basePath: '/crm/leads',
    urlStateConfig: leadsUrlState,
    includeCurrentState: true,
  });
}

/**
 * A specialized hook for any CRM entity deep linking
 */
export function useCrmDeepLink(entity: string) {
  return useDeepLink({
    basePath: `/crm/${entity}`,
    urlStateConfig: {},
    includeCurrentState: false,
  });
}
