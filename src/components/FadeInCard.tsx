import React from 'react';
import { Card, Fade, Slide, Zoom, Grow } from '@mui/material';

interface FadeInCardProps {
  children: React.ReactNode;
  delay?: number;
  animationType?: 'fade' | 'slide' | 'zoom' | 'grow';
  direction?: 'up' | 'down' | 'left' | 'right';
  sx?: any;
}

const FadeInCard: React.FC<FadeInCardProps> = ({
  children,
  delay = 0,
  animationType = 'fade',
  direction = 'up',
  sx = {}
}) => {
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setChecked(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationComponent = () => {
    switch (animationType) {
      case 'slide':
        return (
          <Slide
            in={checked}
            direction={direction as any}
            timeout={600}
          >
            <Card sx={sx}>
              {children}
            </Card>
          </Slide>
        );
      case 'zoom':
        return (
          <Zoom
            in={checked}
            timeout={600}
            style={{ transitionDelay: checked ? `${delay}ms` : '0ms' }}
          >
            <Card sx={sx}>
              {children}
            </Card>
          </Zoom>
        );
      case 'grow':
        return (
          <Grow
            in={checked}
            timeout={600}
            style={{ transitionDelay: checked ? `${delay}ms` : '0ms' }}
          >
            <Card sx={sx}>
              {children}
            </Card>
          </Grow>
        );
      default:
        return (
          <Fade
            in={checked}
            timeout={600}
            style={{ transitionDelay: checked ? `${delay}ms` : '0ms' }}
          >
            <Card sx={sx}>
              {children}
            </Card>
          </Fade>
        );
    }
  };

  return getAnimationComponent();
};

export default FadeInCard;