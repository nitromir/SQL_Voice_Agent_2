export const styles = {
  container: {
    height: '100vh',
    maxHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #000724 0%, #1e1347 100%)',
    color: '#fff',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  backgroundAnimation: {
    position: 'fixed' as const,
    top: '-50%',
    left: '-50%',
    right: '-50%',
    bottom: '-50%',
    width: '200%',
    height: '200%',
    background: 'transparent url(http://assets.iceable.com/img/noise-transparent.png) repeat 0 0',
    animation: 'moveBackground 10s linear infinite',
    opacity: .1,
    visibility: 'visible',
    zIndex: 1,
  },
  title: {
    position: 'relative' as const,
    zIndex: 2,
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#ffc000',
    marginTop: '6rem',
    marginBottom: '1.5rem',
    animation: 'titleGlow 2s ease-in-out infinite',
    textAlign: 'center' as const,
    textShadow: '0 0 10px rgba(255, 192, 0, 0.3)',
    letterSpacing: '-0.02em',
  },
  responseContainer: {
    position: 'relative' as const,
    zIndex: 2,
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 2rem',
  },
  micButton: {
    position: 'relative' as const,
    zIndex: 2,
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 192, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid rgba(255, 192, 0, 0.3)',
    marginBottom: '0.5rem',
    '&:hover': {
      backgroundColor: 'rgba(255, 192, 0, 0.2)',
    },
  },
  micIcon: {
    width: '50px',
    height: '50px',
    color: '#ffc000',
    transition: 'all 0.3s ease',
  },
  messageContainer: {
    width: '100%',
    textAlign: 'center' as const,
    animation: 'floatIn 0.5s ease-out forwards',
    opacity: 0,
    transform: 'translateY(20px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMessage: {
    color: '#ffc000',
    fontSize: '1.4rem',
    fontWeight: '500',
    letterSpacing: '0.02em',
    lineHeight: '1.6',
    opacity: 0.9,
  },
  assistantMessage: {
    color: '#fff',
    fontSize: '1.6rem',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    lineHeight: '1.6',
    opacity: 0.95,
  },
  loadingRing: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    border: '3px solid rgba(255, 192, 0, 0.1)',
    borderTop: '3px solid #ffc000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  '@keyframes floatIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  '@keyframes floatOut': {
    '0%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
    '100%': {
      opacity: 0,
      transform: 'translateY(-20px)',
    },
  },
  '@keyframes pulseScale': {
    '0%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.1)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
  '@keyframes titleGlow': {
    '0%': {
      textShadow: '0 0 10px rgba(255, 192, 0, 0.3)',
    },
    '50%': {
      textShadow: '0 0 20px rgba(255, 192, 0, 0.5)',
    },
    '100%': {
      textShadow: '0 0 10px rgba(255, 192, 0, 0.3)',
    },
  },
  '@keyframes moveBackground': {
    '0%': {
      transform: 'translate(0, 0)',
    },
    '100%': {
      transform: 'translate(-50%, -50%)',
    },
  },
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}

export const keyframes = `
  @keyframes slideUp {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    20% {
      transform: translateY(-10px);
      opacity: 1;
    }
    100% {
      transform: translateY(-45px);
      opacity: 1;
    }
  }

  @keyframes slideDown {
    0% {
      transform: translateY(-45px);
      opacity: 1;
    }
    80% {
      transform: translateY(-10px);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
