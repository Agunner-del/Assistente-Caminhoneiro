import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  LocalGasStation as FuelIcon,
  PhotoCamera as CameraIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AppBottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/transactions') return 1;
    if (path === '/fuel') return 2;
    if (path === '/inventory') return 3;
    if (path === '/settings') return 4;
    return 0;
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/transactions');
        break;
      case 2:
        navigate('/fuel');
        break;
      case 3:
        navigate('/inventory');
        break;
      case 4:
        navigate('/settings');
        break;
    }
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 80,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '12px 8px',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '8px',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '28px',
          },
        }}
      >
        <BottomNavigationAction 
          label="Início" 
          icon={<DashboardIcon />} 
          sx={{ '& .Mui-selected': { color: 'primary.main' } }}
        />
        <BottomNavigationAction 
          label="Lançamentos" 
          icon={<ReceiptIcon />} 
          sx={{ '& .Mui-selected': { color: 'primary.main' } }}
        />
        <BottomNavigationAction 
          label="Abastecer" 
          icon={<FuelIcon />} 
          sx={{ '& .Mui-selected': { color: 'primary.main' } }}
        />
        <BottomNavigationAction 
          label="Inventário" 
          icon={<CameraIcon />} 
          sx={{ '& .Mui-selected': { color: 'primary.main' } }}
        />
        <BottomNavigationAction 
          label="Ajustes" 
          icon={<SettingsIcon />} 
          sx={{ '& .Mui-selected': { color: 'primary.main' } }}
        />
      </BottomNavigation>
    </Paper>
  );
}