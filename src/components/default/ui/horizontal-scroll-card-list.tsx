'use client';

import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useEffect, useRef, useState } from 'react';

interface CarouselProps {
  children: React.ReactNode;
}

const HorizontalScrollCardList = ({ children }: CarouselProps = { children: null }) => {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const checkScroll = () => {
    if (scrollContainer.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.current;
      setShowLeftFade(scrollLeft > 0);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainer.current) {
      const scrollAmount = scrollContainer.current.clientWidth * 0.8;
      scrollContainer.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* Left Fade */}
      {showLeftFade && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Right Fade */}
      {showRightFade && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: 'linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Navigation Buttons */}
      {showLeftFade && (
        <IconButton
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}

      {showRightFade && (
        <IconButton
          onClick={() => scroll('right')}
          sx={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <ChevronRight />
        </IconButton>
      )}

      {/* Scrollable Container */}
      <Box
        ref={scrollContainer}
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          px: 2,
          py: 4,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          '& > *': {
            scrollSnapAlign: 'start',
          },
        }}
        onScroll={checkScroll}
      >
        {children}
      </Box>
    </Box>
  );
};

export default HorizontalScrollCardList;
