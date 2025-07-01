import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Avatar, Typography, Badge, Paper, Button } from '@mui/material';
import { Upload, CreditCard, FileText, Activity, LogOut, Brain } from 'lucide-react';

const Sidebar = ({ selectedTab, onTabChange, onLogout }) => {
  const menuItems = [
    { id: 'upload', icon: Upload, label: 'Upload Files', badge: null },
    { id: 'chat', icon: Upload, label: 'AI Assistant', badge: 3 },
    { id: 'flashcards', icon: CreditCard, label: 'Flashcards', badge: null },
    { id: 'documents', icon: FileText, label: 'Documents', badge: 5 },
    { id: 'analytics', icon: Activity, label: 'Analytics', badge: null },
  ];

  return (
    <Paper
      sx={{
        height: '100vh',
        borderRadius: 0,
        borderRight: '1px solid rgba(56, 189, 248, 0.3)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)',
        }
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
        <Avatar sx={{
          width: 60,
          height: 60,
          mx: 'auto',
          mb: 2,
          background: 'linear-gradient(45deg, #0ea5e9, #38bdf8)',
          fontSize: '1.5rem'
        }}>
          <Brain />
        </Avatar>
        <Typography sx={{ color: '#38bdf8', fontWeight: 700, fontSize: "20px" }}>
          InquiroAI
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: "12px" }}>
          Learning Assistant
        </Typography>
      </Box>

      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            button
            onClick={() => onTabChange(item.id)}
            selected={selectedTab === item.id}
            sx={{
              borderRadius: '5px',
              mb: 1,
              backgroundColor: selectedTab === item.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: selectedTab === item.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
              '&:hover': {
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }
            }}
          >
            <ListItemIcon sx={{ color: selectedTab === item.id ? '#38bdf8' : 'rgba(255,255,255,0.7)' }}>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  <item.icon size={20} />
                </Badge>
              ) : (
                <item.icon size={20} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                color: selectedTab === item.id ? '#38bdf8' : 'rgba(255,255,255,0.8)',
                fontSize: "14px",
                '& .MuiTypography-root': { fontWeight: selectedTab === item.id ? 600 : 400 }
              }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<LogOut size={16} />}
          onClick={onLogout}
          sx={{
            background: 'transparent',
            border: '1px solid #38bdf8',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(56, 189, 248, 0.1)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
              transform: 'translateY(-2px)',
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Paper>
  );
};

export default Sidebar;