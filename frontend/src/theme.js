import { createTheme } from "@mui/material/styles"

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#00ffff",
            light: "#4dffff",
            dark: "#00cccc",
        },
        secondary: {
            main: "#0080ff",
            light: "#4da6ff",
            dark: "#0066cc",
        },
        background: {
            default: "#0a0a0a",
            paper: "rgba(26, 26, 46, 0.8)",
        },
        text: {
            primary: "#ffffff",
            secondary: "rgba(255, 255, 255, 0.7)",
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            background: "linear-gradient(45deg, #00ffff, #0080ff)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(0, 255, 255, 0.2)",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                },
                contained: {
                    background: "linear-gradient(45deg, rgba(0, 255, 255, 0.2), rgba(0, 128, 255, 0.2))",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    "&:hover": {
                        background: "linear-gradient(45deg, rgba(0, 255, 255, 0.3), rgba(0, 128, 255, 0.3))",
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: "rgba(0, 255, 255, 0.3)",
                        },
                        "&:hover fieldset": {
                            borderColor: "rgba(0, 255, 255, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#00ffff",
                        },
                    },
                    "& .MuiInputLabel-root": {
                        color: "rgba(255, 255, 255, 0.7)",
                        "&.Mui-focused": {
                            color: "#00ffff",
                        },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    backdropFilter: "blur(10px)",
                },
            },
        },
    },
})

export default theme
