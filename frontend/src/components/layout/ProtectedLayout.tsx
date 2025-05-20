import { useState, useContext } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar, Box, Drawer, IconButton, Toolbar, Typography,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Menu, MenuItem, Button, useMediaQuery, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, DirectionsCar, Build,
  Brightness4, Brightness7, Language, Logout
} from '@mui/icons-material';
import { AppContext } from '../../context/AppContext';

const drawerWidth = 240;

const ProtectedLayout = () => {
  const { t } = useTranslation();
  const { themeMode, toggleTheme, language, changeLanguage } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageMenu, setLanguageMenu] = useState<null | HTMLElement>(null);
  const location = useLocation();

  // Verificar se o usuário está autenticado
  const isAuthenticated = localStorage.getItem('token') !== null;

  if (!isAuthenticated) {
    // Redirecionar para login se não estiver autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenu(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenu(null);
  };

  const handleLanguageChange = (lng: string) => {
    changeLanguage(lng);
    handleLanguageMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const menuItems = [
    { text: t('dashboard.title'), icon: <Dashboard />, path: '/' },
    { text: t('assets.title'), icon: <DirectionsCar />, path: '/assets' },
    { text: t('maintenance.title'), icon: <Build />, path: '/maintenance' },
  ];

  const drawer = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {t('app.title')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              window.location.href = item.path;
              if (isMobile) handleDrawerToggle();
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || t('app.title')}
          </Typography>

          {/* Botão de alternância de tema */}
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* Menu de idiomas */}
          <IconButton
            color="inherit"
            aria-controls="language-menu"
            aria-haspopup="true"
            onClick={handleLanguageMenuOpen}
          >
            <Language />
          </IconButton>
          <Menu
            id="language-menu"
            anchorEl={languageMenu}
            keepMounted
            open={Boolean(languageMenu)}
            onClose={handleLanguageMenuClose}
          >
            <MenuItem onClick={() => handleLanguageChange('pt')}>
              {t('app.language.pt')}
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange('en')}>
              {t('app.language.en')}
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange('es')}>
              {t('app.language.es')}
            </MenuItem>
          </Menu>

          {/* Botão de logout */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<Logout />}
          >
            {t('auth.logout')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Drawer para dispositivos móveis */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Melhor desempenho em dispositivos móveis
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer para desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProtectedLayout;