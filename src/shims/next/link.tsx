import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export function Link({ href, to, children, className, style, ...props }: any) {
  const target = href ?? to ?? '/';
  return (
    <RouterLink to={target} className={className} style={style} {...props}>
      {children}
    </RouterLink>
  );
}

export default Link;
