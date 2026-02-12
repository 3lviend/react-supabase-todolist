import { useIsPowerSync, useStatusOptional } from '@/hooks/useSyncEngine';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { FC, ReactNode } from 'react';

/**
 * A component that renders its child if the database has been synced at least once and shows
 * a progress indicator otherwise.
 *
 * In ElectricSQL mode, this always renders children since sync status is
 * handled at the provider level (isLoading in ElectricSyncContext).
 */
export const GuardBySync: FC<{ children: ReactNode; priority?: number }> = ({ children, priority }) => {
  const isPowerSync = useIsPowerSync();
  const status = useStatusOptional();

  // In ElectricSQL mode, always render children (sync guard not applicable)
  if (!isPowerSync || !status) {
    return children;
  }

  const hasSynced = priority == null ? status.hasSynced : status.statusForPriority(priority).hasSynced;
  if (hasSynced) {
    return children;
  }

  // If we haven't completed a sync yet, show a progress indicator!
  const allProgress = status.downloadProgress;
  const progress = priority == null ? allProgress : allProgress?.untilPriority(priority);

  return (
    <Stack direction="column" spacing={1} sx={{ p: 4 }} alignItems="stretch">
      {progress != null ? (
        <>
          <LinearProgress variant="determinate" value={progress.downloadedFraction * 100} />
          <Box sx={{ alignSelf: 'center' }}>
            {progress.downloadedOperations == progress.totalOperations ? (
              <Typography>Applying server-side changes</Typography>
            ) : (
              <Typography>
                Downloaded {progress.downloadedOperations} out of {progress.totalOperations}.
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <LinearProgress variant="indeterminate" />
      )}
    </Stack>
  );
};
