import React from "react";

const GlobalBackground = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #000000 15%, #0a0820 30%, #110e2c 55%, #18123a 75%, #1a1740 90%, #130F40 100%)',
    }}
    aria-hidden="true"
  />
);

export default GlobalBackground;