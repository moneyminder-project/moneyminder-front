import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import 'react-tooltip/dist/react-tooltip.css';
import App from './App.jsx'
library.add(fas);
library.add(far);

createRoot(document.getElementById('root')).render(
    <App />
);
