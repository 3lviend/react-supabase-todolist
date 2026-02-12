import { LOGIN_ROUTE, SQL_CONSOLE_ROUTE, TODO_LISTS_ROUTE } from '@/app/router';
import { useNavigationPanel } from '@/components/navigation/NavigationPanelContext';
import { useSupabase } from '@/components/providers/SyncProvider';
import { useIsPowerSync, usePowerSyncOptional, useStatusOptional } from '@/hooks/useSyncEngine';
import { useElectricSyncStatus } from '@/components/providers/electric_sql/SystemProvider';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import NorthIcon from '@mui/icons-material/North';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SouthIcon from '@mui/icons-material/South';
import TerminalIcon from '@mui/icons-material/Terminal';
import WifiIcon from '@mui/icons-material/Wifi';
import SyncIcon from '@mui/icons-material/Sync';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  styled
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ViewsLayout({ children }: { children: React.ReactNode }) {
  const isPowerSync = useIsPowerSync();
  const powerSync = usePowerSyncOptional();
  const status = useStatusOptional();
  const electricStatus = isPowerSync ? null : useElectricSyncStatus();
  const supabase = useSupabase();
  const navigate = useNavigate();

  const [openDrawer, setOpenDrawer] = React.useState(false);
  const { title, actions } = useNavigationPanel();

  const [connectionAnchor, setConnectionAnchor] = React.useState<null | HTMLElement>(null);

  const NAVIGATION_ITEMS = React.useMemo(() => {
    // ... items logic
    const items = [
      {
        path: TODO_LISTS_ROUTE,
        title: 'TODO Lists',
        icon: () => <ChecklistRtlIcon />
      }
    ];

    // SQL Console is only available in PowerSync mode
    if (isPowerSync) {
      items.unshift({
        path: SQL_CONSOLE_ROUTE,
        title: 'SQL Console',
        icon: () => <TerminalIcon />
      });
    }

    items.push({
      path: LOGIN_ROUTE,
      title: 'Sign Out',
      beforeNavigate: async () => {
        if (powerSync) {
          await powerSync.disconnectAndClear();
        }
        if (electricStatus?.connected) {
          electricStatus.disconnect();
        }
        await supabase?.client.auth.signOut();
      },
      icon: () => <ExitToAppIcon />
    } as any);

    return items;
  }, [powerSync, supabase, isPowerSync, electricStatus]);

  return (
    <S.MainBox>
      <S.TopBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setOpenDrawer(!openDrawer)}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography>{title}</Typography>
          </Box>
          {actions && <Box sx={{ marginRight: 2 }}>{actions}</Box>}
          {isPowerSync && (
            <>
              <NorthIcon sx={{ marginRight: '-10px' }} color={status?.dataFlowStatus.uploading ? 'primary' : 'inherit'} />
              <SouthIcon color={status?.dataFlowStatus.downloading ? 'primary' : 'inherit'} />
              <Box
                sx={{ cursor: 'pointer' }}
                onClick={(event) => {
                  setConnectionAnchor(event.currentTarget);
                }}>
                {status?.connected ? <WifiIcon /> : <SignalWifiOffIcon />}
              </Box>
              <Menu
                id="connection-menu"
                anchorEl={connectionAnchor}
                open={Boolean(connectionAnchor)}
                onClose={() => setConnectionAnchor(null)}>
                {status?.connected || status?.connecting ? (
                  <MenuItem
                    onClick={() => {
                      setConnectionAnchor(null);
                      powerSync?.disconnect();
                    }}>
                    Disconnect
                  </MenuItem>
                ) : supabase ? (
                  <MenuItem
                    onClick={() => {
                      setConnectionAnchor(null);
                      powerSync?.connect(supabase as any);
                    }}>
                    Connect
                  </MenuItem>
                ) : null}
              </Menu>
            </>
          )}
          {!isPowerSync && electricStatus && (
            <>
              {electricStatus.connecting && (
                <SyncIcon sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              )}
              <Box
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
                onClick={(event) => {
                  setConnectionAnchor(event.currentTarget);
                }}>
                {electricStatus.connected ? <WifiIcon /> : <SignalWifiOffIcon />}
                <Typography variant="caption">Electric</Typography>
              </Box>
              <Menu
                id="electric-connection-menu"
                anchorEl={connectionAnchor}
                open={Boolean(connectionAnchor)}
                onClose={() => setConnectionAnchor(null)}>
                {electricStatus.connected || electricStatus.connecting ? (
                  <MenuItem
                    onClick={() => {
                      setConnectionAnchor(null);
                      electricStatus.disconnect();
                    }}>
                    Disconnect
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={async () => {
                      setConnectionAnchor(null);
                      await electricStatus.connect();
                    }}>
                    Connect
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Toolbar>
      </S.TopBar>
      <Drawer anchor={'left'} open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <S.PowerSyncLogo alt="PowerSync Logo" width={250} height={100} src="/powersync-logo.svg" />
        <Divider />
        <List>
          {NAVIGATION_ITEMS.map((item) => (
            <ListItem key={item.path}>
              <ListItemButton
                onClick={async () => {
                  await (item as any).beforeNavigate?.();
                  navigate(item.path);
                  setOpenDrawer(false);
                }}>
                <ListItemIcon>{item.icon()}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <S.MainBox>{children}</S.MainBox>
    </S.MainBox>
  );
}

namespace S {
  export const MainBox = styled(Box)`
    flex-grow: 1;
  `;

  export const TopBar = styled(AppBar)`
    margin-bottom: 20px;
  `;

  export const PowerSyncLogo = styled('img')`
    max-width: 250px;
    max-height: 250px;
    object-fit: contain;
    padding: 20px;
  `;
}
