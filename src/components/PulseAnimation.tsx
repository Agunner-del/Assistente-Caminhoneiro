import React from 'react';
import { Box, keyframes } from '@mui/material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

interface PulseAnimationProps {
  isActive: boolean;
  children: React.ReactNode;
  color?: string;
  size?: number;
}

const PulseAnimation = React.forwardRef<HTMLDivElement, PulseAnimationProps>(
  ({ isActive, children, color = '#f44336', size = 72 }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isActive && (
          <Box
            sx={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.3,
              animation: `${ripple} 1.5s ease-in-out infinite`,
            }}
          />
        )}
        <Box
          sx={{
            position: 'relative',
            animation: isActive ? `${pulse} 1.5s ease-in-out infinite` : 'none',
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }
);

export default PulseAnimation;
