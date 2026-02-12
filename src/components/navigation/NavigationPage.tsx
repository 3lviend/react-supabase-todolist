import React from 'react';
import { useNavigationPanel } from './NavigationPanelContext';
import { Box, styled } from '@mui/material';

/**
 * Wraps a component with automatic navigation panel title management
 */
export const NavigationPage: React.FC<React.PropsWithChildren<{ title: string; actions?: React.ReactNode }>> = ({
  title,
  actions,
  children
}) => {
  const navigationPanel = useNavigationPanel();

  React.useEffect(() => {
    navigationPanel.setTitle(title);
    navigationPanel.setActions(actions || null);

    return () => {
      navigationPanel.setTitle('');
      navigationPanel.setActions(null);
    };
  }, [title, actions, navigationPanel]);

  return <S.Container>{children}</S.Container>;
};

namespace S {
  export const Container = styled(Box)`
    margin: 10px;
  `;
}
