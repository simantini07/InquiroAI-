import React from 'react';
import { Box, Typography, Grid, Chip, Paper } from '@mui/material';
import { FileText } from 'lucide-react';

const DocumentList = ({ documents }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ color: 'primary.main', mb: 3, fontWeight: 700, fontSize: "20px" }}
      >
        Document Library
      </Typography>

      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Paper
              sx={{
                p: 3,
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateY(-4px)' },
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FileText size={24} color="primary.main" />
                <Typography variant="h6" sx={{ ml: 2, color: 'text.primary', flex: 1 }}>
                  {doc.title}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Uploaded {new Date().toLocaleDateString()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="PDF" size="small" sx={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: 'primary.main' }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {documents.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
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
          <FileText size={35} color="text.secondary" />
          <Typography sx={{ color: 'text.primary', mb: 2, fontSize: "15px" }}>
            No Documents Yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: "12px" }}>
            Upload your first document to get started
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DocumentList;
