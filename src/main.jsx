// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import './index.css';
import AppShell from './AppShell.jsx';
import { startCpuProfile, stopCpuProfile, cpuProfileEnabled } from './utils/cpuProfiler';

// Diagnostic only (no-op unless ?cpuprofile): start sampling from boot so the
// profile covers the whole load, including frame work that races ahead of the
// bulk-import gate.  Auto-stops after 60s as a safety net.
startCpuProfile();
if (cpuProfileEnabled) setTimeout(stopCpuProfile, 60000);

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <AppShell />
  // </StrictMode>,
);
