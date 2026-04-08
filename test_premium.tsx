import React from 'react';
import { createRoot } from 'react-dom/client';
import { PremiumLiquidShockwave } from './src/components/PremiumLiquidShockwave';

const root = createRoot(document.getElementById('root')!);
root.render(
  <div style={{width: '100vw', height: '100vh', backgroundColor: 'black'}}>
    <PremiumLiquidShockwave />
  </div>
);
