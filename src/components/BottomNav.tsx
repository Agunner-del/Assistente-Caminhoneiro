import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  LocalGasStation as GasIcon,
  PhotoCamera as CameraIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/transactions':
        return 1;
      case '/fuel':
        return 2;
      case '/inventory':
        return 3;
      case '/profile':
        return 4;
      default:
        return 0;
    }
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
        navigate('/profile');
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getValue()}
        onChange={handleChange}
        showLabels
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon sx={{ fontSize: 32 }} />}
        />
        <BottomNavigationAction
          label="Lançamentos"
          icon={<ReceiptIcon sx={{ fontSize: 32 }} />}
        />
        <BottomNavigationAction
          label="Abastecer"
          icon={<GasIcon sx={{ fontSize: 32 }} />}
        />
        <BottomNavigationAction
          label="Inventário"
          icon={<CameraIcon sx={{ fontSize: 32 }} />}
        />
        <BottomNavigationAction
          label="Perfil"
          icon={<PersonIcon sx={{ fontSize: 32 }} />}
        />
      </BottomNavigation>
    </Paper>
  );
}