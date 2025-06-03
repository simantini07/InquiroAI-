// src/LoginPage.js
import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button, Typography, Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        const formData = new URLSearchParams();
        formData.append('username', form.username);
        formData.append('password', form.password);

        const res = await fetch('http://localhost:8000/login', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.access_token);
            alert('Login successful!');
        } else {
            alert(data.detail || 'Login failed');
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ background: '#0d0d0d' }}>
            <Card sx={{ width: 400, p: 3, borderRadius: 4, boxShadow: 10 }}>
                <CardContent>
                    <Typography variant="h4" align="center" gutterBottom>Login</Typography>
                    <TextField
                        label="Username"
                        name="username"
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
                    <Button variant="contained" fullWidth onClick={handleSubmit} sx={{ mt: 2 }}>Login</Button>
                    <Typography align="center" sx={{ mt: 2 }}>
                        Don’t have an account?{' '}
                        <Link href="/register" underline="hover" color="primary">
                            Register
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage;
