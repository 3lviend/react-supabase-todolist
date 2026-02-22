import React from 'react';
import { CircularProgress, Grid, styled } from '@mui/material';
import { useSupabase } from '@/components/providers/SyncProvider';
import { Navigate } from 'react-router-dom';
import { DEFAULT_ENTRY_ROUTE, LOGIN_ROUTE } from '@/app/router';

export type LoginFormParams = {
  email: string;
  password: string;
};

/**
 * This page redirects either to the app or auth flow based on session.
 */
export default function EntryPage() {
  const connector = useSupabase();

  if (!connector || !connector.ready) {
    return (
      <S.MainGrid container>
        <S.CenteredGrid item xs={12} md={6} lg={5}>
          <CircularProgress />
        </S.CenteredGrid>
      </S.MainGrid>
    );
  }

  if (connector.currentSession) {
    return <Navigate to={DEFAULT_ENTRY_ROUTE} replace />;
  } else {
    return <Navigate to={LOGIN_ROUTE} replace />;
  }
}

namespace S {
  export const CenteredGrid = styled(Grid)`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  export const MainGrid = styled(CenteredGrid)`
    min-height: 100vh;
  `;
}
