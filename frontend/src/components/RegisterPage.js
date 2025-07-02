import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
} from "@mui/material"
import { PersonAdd, Person } from "@mui/icons-material"

const API_BASE_URL = "http://127.0.0.1:8000"

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Registration failed")
            }

            setSuccess("Registration successful! Redirecting to login...")
            setTimeout(() => {
                navigate("/login")
            }, 2000)
        } catch (error) {
            setError(error.message || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
                p: 3,
            }}
        >
            <Card
                sx={{
                    maxWidth: 400,
                    width: "100%",
                    background: "linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.1) 100%)",
                    border: "1px solid rgba(0, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <Person
                            sx={{
                                fontSize: 64,
                                color: "#00ffff",
                                mb: 2,
                            }}
                        />
                        <Typography
                            variant="h4"
                            sx={{
                                color: "white",
                                fontWeight: "bold",
                                background: "linear-gradient(45deg, #00ffff, #0080ff)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                mb: 1,
                            }}
                        >
                            InquiroAI Register
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                            Join the AI learning revolution
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {success}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            name="username"
                            label="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            name="email"
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                            sx={{
                                py: 1.5,
                                bgcolor: "rgba(0, 255, 255, 0.2)",
                                border: "1px solid #00ffff",
                                color: "#00ffff",
                                "&:hover": {
                                    bgcolor: "rgba(0, 255, 255, 0.3)",
                                },
                            }}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                            Already have an account?{" "}
                            <Button
                                onClick={() => navigate("/login")}
                                sx={{
                                    color: "#00ffff",
                                    textTransform: "none",
                                    p: 0,
                                    minWidth: "auto",
                                    "&:hover": {
                                        bgcolor: "transparent",
                                        textDecoration: "underline",
                                    },
                                }}
                            >
                                Sign in here
                            </Button>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default RegisterPage