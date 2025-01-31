'use client';

import React, { useEffect, useState } from 'react';

const Particles = () => {
  const [particles, setParticles] = useState<Array<{
    top: number;
    left: number;
    duration: number;
    type: number;
  }>>([]);

  useEffect(() => {
    const newParticles = [...Array(30)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 8 + Math.random() * 15,
      type: Math.floor(Math.random() * 3),
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      {particles.map((particle, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            width: '3px',
            height: '3px',
            background: '#ffc000',
            boxShadow: '0 0 10px #ffc000',
            borderRadius: '50%',
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            animation: `float${particle.type} ${particle.duration}s ease-in-out infinite`,
            opacity: 0.05,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
};

export const Background: React.FC = () => {
  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #000724 0%, #1e1347 100%)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'fixed',
        top: '-50%',
        left: '-50%',
        right: '-50%',
        bottom: '-50%',
        width: '200%',
        height: '200%',
        background: 'transparent url(http://assets.iceable.com/img/noise-transparent.png) repeat 0 0',
        animation: 'moveBackground 10s linear infinite',
        opacity: 0.1,
        zIndex: 1,
      }} />
      <Particles />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
        
        @keyframes moveBackground {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-50%, -50%);
          }
        }

        @keyframes float0 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(100px, -100px) scale(1.5);
            opacity: 0.6;
          }
        }

        @keyframes float1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(-100px, -150px) scale(1.5);
            opacity: 0.6;
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(50px, -200px) scale(1.5);
            opacity: 0.6;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulseScale {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #000724;
          overflow: hidden;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
};
