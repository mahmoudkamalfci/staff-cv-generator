import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">GISCON CV Generator</h1>
        <p className="text-muted-foreground">Design system loaded ✓</p>
        <div className="flex gap-2 justify-center">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm">
            Primary
          </span>
          <span className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-sm">
            Accent
          </span>
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm">Muted</span>
        </div>
      </div>
    </div>
  </React.StrictMode>,
);
