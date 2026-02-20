import { FC, ReactNode } from 'react';

/**
 * A component that renders its child.
 */
export const GuardBySync: FC<{ children: ReactNode; priority?: number }> = ({ children }) => {
  return children;
};
