import { createTheme } from '@mui/material/styles';

// Dark theme configuration for Copiloto de Estrada
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFC107', // Amber - primary accent color
      light: '#FFD54F',
      dark: '#FFA000',
    },
    secondary: {
      main: '#FF5722', // Deep Orange - secondary accent color
      light: '#FF7043',
      dark: '#E64A19',
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1E1E1E',   // Surface color
    },
    text: {
      primary: '#FFFFFF',  // Primary text
      secondary: '#B0B0B0', // Secondary text
    },
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#2196F3',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.125rem', // 18px for better readability
    },
    body2: {
      fontSize: '1rem', // 16px minimum for accessibility
    },
    button: {
      fontSize: '1.125rem',
      fontWeight: 600,
      textTransform: 'none', // Don't uppercase buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '60px', // Fat finger rule - minimum 60px height
          borderRadius: '12px',
          padding: '12px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
          color: '#000',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFB300 100%)',
          },
        },
        outlined: {
          borderColor: '#FFC107',
          color: '#FFC107',
          '&:hover': {
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 193, 7, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            minHeight: '60px', // Fat finger rule
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 193, 7, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: '#FFC107',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFC107',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '1.125rem',
            color: '#B0B0B0',
            '&.Mui-focused': {
              color: '#FFC107',
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '1.125rem',
            color: '#FFFFFF',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          width: '72px', // Large FAB for primary actions
          height: '72px',
          background: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
          color: '#000',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFB300 100%)',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          borderTop: '1px solid rgba(255, 193, 7, 0.2)',
          height: '80px', // Larger navigation for accessibility
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: '80px',
          color: '#B0B0B0',
          '&.Mui-selected': {
            color: '#FFC107',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.875rem',
            fontWeight: 600,
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: '12px',
            fontSize: '1rem',
          },
        },
      },
    },
  },
  spacing: 8, // Base spacing unit (8px) for consistent layout
  shape: {
    borderRadius: 12, // Rounded corners throughout
  },
});