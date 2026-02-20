import { LOGIN_ROUTE, TODO_LISTS_ROUTE } from '@/app/router';
import { useNavigationPanel } from '@/components/navigation/NavigationPanelContext';
import { useSupabase } from '@/components/providers/SyncProvider';
import { useElectricSyncStatus } from '@/components/providers/electric_sql/SystemProvider';
import { ElectricConnectionMenu } from '@/components/navigation/ElectricConnectionMenu';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
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
  Toolbar,
  Typography,
  styled
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ViewsLayout({ children }: { children: React.ReactNode }) {
  const electricStatus = useElectricSyncStatus();
  const supabase = useSupabase();
  const navigate = useNavigate();

  const [openDrawer, setOpenDrawer] = React.useState(false);
  const { title, actions } = useNavigationPanel();

  const NAVIGATION_ITEMS = React.useMemo(() => {
    // ... items logic
    const items = [
      {
        path: TODO_LISTS_ROUTE,
        title: 'TODO Lists',
        icon: () => <ChecklistRtlIcon />
      }
    ];

    items.push({
      path: LOGIN_ROUTE,
      title: 'Sign Out',
      beforeNavigate: async () => {
        if (electricStatus?.connected) {
          electricStatus.disconnect();
        }
        await supabase?.client.auth.signOut();
      },
      icon: () => <ExitToAppIcon />
    } as any);

    return items;
  }, [supabase, electricStatus]);

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

          {electricStatus && <ElectricConnectionMenu />}
        </Toolbar>
      </S.TopBar>
      <Drawer anchor={'left'} open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <S.ElectricSqlLogo alt="ElectricSQL Logo" width={200} height={80} src="/electricsql-logo.svg" />
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

  export const ElectricSqlLogo = styled('img')`
    max-width: 250px;
    max-height: 100px;
    object-fit: contain;
    padding: 20px;
  `;
}
