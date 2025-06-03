// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#00ffea' },
        secondary: { main: '#ff00ff' },
        background: {
            default: '#0d0d0d',
            paper: '#1a1a1a',
        },
        text: {
            primary: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Orbitron", "Roboto", "Arial", sans-serif',
    },
});

export default theme;
