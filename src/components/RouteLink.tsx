import React, { forwardRef } from 'react';
import { buildPath, type Route } from '../utils/router';
import { navigate, type NavigateOptions } from '../hooks/useRouter';

export interface RouteLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  route: Route;
  replace?: boolean;
  scroll?: boolean;
  hash?: string;
  keepHash?: boolean;
}

/**
 * A real <a href> for internal navigation: middle-click, cmd-click,
 * "open in new tab" and copy-link all keep working, while a normal click
 * uses the client router so no full page reload happens.
 */
export const RouteLink = forwardRef<HTMLAnchorElement, RouteLinkProps>(function RouteLink(
  { route, replace, scroll, hash, keepHash, onClick, children, ...rest },
  ref
) {
  const href = `${buildPath(route)}${hash ? `#${hash}` : ''}`;
  const options: NavigateOptions = { replace, scroll, hash, keepHash };

  return (
    <a
      ref={ref}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(route, options);
      }}
      {...rest}
    >
      {children}
    </a>
  );
});
