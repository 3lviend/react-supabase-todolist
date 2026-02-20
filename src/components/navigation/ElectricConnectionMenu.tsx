import { useElectricSyncStatus } from '@/components/providers/electric_sql/SystemProvider';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import WifiIcon from '@mui/icons-material/Wifi';
import { Box, Menu, MenuItem, Typography } from '@mui/material';
import React from 'react';

/**
 * Menu to display ElectricSQL connection status and toggle connection.
 */
export const ElectricConnectionMenu = () => {
  const electricStatus = useElectricSyncStatus();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  if (!electricStatus) {
    return null;
  }

  return (
    <>
      {electricStatus.connecting && (
        <SyncIcon
          sx={{
            animation: 'spin 1s linear infinite',
            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
          }}
        />
      )}
      <Box
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}>
        {electricStatus.connected ? <WifiIcon /> : <SignalWifiOffIcon />}
        <Typography variant="caption">Electric</Typography>
      </Box>
      <Menu
        id="electric-connection-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}>
        {electricStatus.connected || electricStatus.connecting ? (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              electricStatus.disconnect();
            }}>
            Disconnect
          </MenuItem>
        ) : (
          <MenuItem
            onClick={async () => {
              setAnchorEl(null);
              await electricStatus.connect();
            }}>
            Connect
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
