'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  Receipt,
  History,
  Settings,
  Logout,
  DarkMode,
  LightMode,
  ChevronLeft,
  Add,
  QrCodeScanner,
  Home,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorMode } from '@/app/ThemeProvider';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: Dashboard, path: '/dashboard' },
  { text: 'Inventory', icon: Inventory, path: '/inventory' },
  { text: 'Create Invoice', icon: Receipt, path: '/invoices/create' },
  { text: 'Invoice History', icon: History, path: '/invoices' },
  { text: 'Settings', icon: Settings, path: '/settings' },
];

export default function MainLayout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleColorMode } = useColorMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [store, setStore] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch('/api/store');
        if (res.ok) {
          const data = await res.json();
          setStore(data);
        }
      } catch (error) {
        console.error('Error fetching store:', error);
      }
    };
    if (session) {
      fetchStore();
    }
  }, [session]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            width: 45,
            height: 45,
            borderRadius: '12px',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src="/logo.png"
            alt="Invoice Pro Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold" noWrap>
            Invoice Pro
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Billing Software
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                selected={isActive}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  '&.Mui-selected': {
                    background: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      background: theme.palette.primary.dark,
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    background: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'white' : theme.palette.text.secondary,
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={toggleColorMode}
            sx={{
              borderRadius: 2,
              py: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </ListItemIcon>
            <ListItemText
              primary={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, color: theme.palette.text.primary, fontWeight: 600 }}
          >
            {menuItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))?.text || 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Avatar
                src={store?.logo || ''}
                sx={{
                  width: 35,
                  height: 35,
                  background: theme.palette.primary.main,
                }}
              >
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          background: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {session?.user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {session?.user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile Bottom Dock */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            py: 1,
            px: 2,
            zIndex: 1200,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <IconButton
            component={Link}
            href="/dashboard"
            sx={{
              color: pathname === '/dashboard' ? theme.palette.primary.main : theme.palette.text.secondary,
              flexDirection: 'column',
              borderRadius: 2,
              py: 0.5,
              px: 2,
              background: pathname === '/dashboard' ? `${theme.palette.primary.main}15` : 'transparent',
            }}
          >
            <Home sx={{ fontSize: 24 }} />
            <Typography variant="caption" sx={{ fontSize: '10px', mt: 0.5 }}>
              Home
            </Typography>
          </IconButton>

          <IconButton
            component={Link}
            href="/invoices/scan"
            sx={{
              color: pathname === '/invoices/scan' ? theme.palette.primary.main : theme.palette.text.secondary,
              flexDirection: 'column',
              borderRadius: 2,
              py: 0.5,
              px: 2,
              background: pathname === '/invoices/scan' ? `${theme.palette.primary.main}15` : 'transparent',
            }}
          >
            <QrCodeScanner sx={{ fontSize: 24 }} />
            <Typography variant="caption" sx={{ fontSize: '10px', mt: 0.5 }}>
              Scan
            </Typography>
          </IconButton>

          <IconButton
            component={Link}
            href="/invoices/create"
            sx={{
              color: 'white',
              background: theme.palette.primary.main,
              borderRadius: '50%',
              width: 56,
              height: 56,
              mt: -3,
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
              '&:hover': {
                background: theme.palette.primary.dark,
              },
            }}
          >
            <Add sx={{ fontSize: 28 }} />
          </IconButton>

          <IconButton
            component={Link}
            href="/invoices"
            sx={{
              color: pathname.startsWith('/invoices') && pathname !== '/invoices/create' && pathname !== '/invoices/scan'
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
              flexDirection: 'column',
              borderRadius: 2,
              py: 0.5,
              px: 2,
              background: pathname.startsWith('/invoices') && pathname !== '/invoices/create' && pathname !== '/invoices/scan'
                ? `${theme.palette.primary.main}15`
                : 'transparent',
            }}
          >
            <History sx={{ fontSize: 24 }} />
            <Typography variant="caption" sx={{ fontSize: '10px', mt: 0.5 }}>
              History
            </Typography>
          </IconButton>

          <IconButton
            component={Link}
            href="/settings"
            sx={{
              color: pathname === '/settings' ? theme.palette.primary.main : theme.palette.text.secondary,
              flexDirection: 'column',
              borderRadius: 2,
              py: 0.5,
              px: 2,
              background: pathname === '/settings' ? `${theme.palette.primary.main}15` : 'transparent',
            }}
          >
            <Settings sx={{ fontSize: 24 }} />
            <Typography variant="caption" sx={{ fontSize: '10px', mt: 0.5 }}>
              Settings
            </Typography>
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
