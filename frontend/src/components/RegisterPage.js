// src/RegisterPage.js
import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button, Typography, Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        const res = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (res.ok) {
            alert('Registration successful!');
            navigate('/');
        } else {
            alert(data.detail || 'Registration failed');
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ background: '#0d0d0d' }}>
            <Card sx={{ width: 400, p: 3, borderRadius: 4, boxShadow: 10 }}>
                <CardContent>
                    <Typography variant="h4" align="center" gutterBottom>Register</Typography>
                    <TextField
                        label="Username"
                        name="username"
                        fullWidth
                        margin="normal"
                        onChange={handleChange}
                    />
                    <TextField
                        label="Email"
                        name="email"
                        fullWidth
                        margin="normal"
                        onChange={handleChange}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        name="password"
                        fullWidth
                        margin="normal"
                        onChange={handleChange}
                    />
                    <Button variant="contained" fullWidth onClick={handleSubmit} sx={{ mt: 2 }}>Register</Button>
                    <Typography align="center" sx={{ mt: 2 }}>
                        Already have an account?{' '}
                        <Link href="/" underline="hover" color="primary">
                            Login
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RegisterPage;
