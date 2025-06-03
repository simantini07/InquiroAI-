import React, { useState, useEffect, createContext, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Card,
    CardContent,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    LinearProgress,
    Badge,
    Fab,
    Snackbar,
    Alert,
    Grid,
    Avatar,
    Divider
} from '@mui/material';
import {
    Upload,
    CreditCard,
    FileText,
    User,
    LogOut,
    Send,
    Download,
    Brain,
    Zap,
    Activity,
    Settings,
    Search,
    Plus,
    Eye,
    BookOpen,
    Star,
    Clock
} from 'lucide-react';

// Auth Context
const AuthContext = createContext();

// Mock API service
const api = {
    upload: async (file) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { id: Date.now().toString(), title: file.name };
    },
    query: async (question, docId) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            query_id: Date.now().toString(),
            answer: `Based on the uploaded document, here's the answer to "${question}": This is a comprehensive response that analyzes the content and provides relevant insights. The system has processed your query and generated this contextual response.`,
            documents: [{ id: docId, title: 'Sample Document.pdf' }]
        };
    },
    generateFlashcards: async (docId, count) => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return {
            flashcards: Array.from({ length: count }, (_, i) => ({
                flashcard_id: `card_${i}`,
                question: `Sample Question ${i + 1}: What is the key concept discussed in section ${i + 1}?`,
                answer: `This is the detailed answer explaining the concept from section ${i + 1}. It covers the main points and provides comprehensive understanding.`
            }))
        };
    }
};

// Styled Components
const StyledPaper = ({ children, sx = {}, ...props }) => (
    <Paper
        {...props}
        sx={{
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
            },
            ...sx
        }}
    >
        {children}
    </Paper>
);

const GlowButton = ({ children, variant = 'contained', sx = {}, ...props }) => (
    <Button
        {...props}
        variant={variant}
        sx={{
            background: variant === 'contained'
                ? 'linear-gradient(45deg, #0ea5e9 30%, #38bdf8 90%)'
                : 'transparent',
            border: variant === 'outlined' ? '1px solid #38bdf8' : 'none',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: variant === 'contained'
                ? '0 4px 20px rgba(56, 189, 248, 0.3)'
                : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
                background: variant === 'contained'
                    ? 'linear-gradient(45deg, #0284c7 30%, #0ea5e9 90%)'
                    : 'rgba(56, 189, 248, 0.1)',
                boxShadow: variant === 'contained'
                    ? '0 6px 25px rgba(56, 189, 248, 0.4)'
                    : '0 0 10px rgba(56, 189, 248, 0.3)',
                transform: 'translateY(-2px)',
            },
            ...sx
        }}
    >
        {children}
    </Button>
);

// Sidebar Component
const Sidebar = ({ selectedTab, onTabChange, onLogout }) => {
    const menuItems = [
        { id: 'upload', icon: Upload, label: 'Upload Files', badge: null },
        { id: 'chat', icon: Upload, label: 'AI Assistant', badge: 3 },
        { id: 'flashcards', icon: CreditCard, label: 'Flashcards', badge: null },
        { id: 'documents', icon: FileText, label: 'Documents', badge: 5 },
        { id: 'analytics', icon: Activity, label: 'Analytics', badge: null },
    ];

    return (
        <StyledPaper sx={{ height: '100vh', borderRadius: 0, borderRight: '1px solid rgba(56, 189, 248, 0.3)' }}>
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
                <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 700 }}>
                    NEXUS AI
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
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
                            borderRadius: '8px',
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
                                '& .MuiTypography-root': { fontWeight: selectedTab === item.id ? 600 : 400 }
                            }}
                        />
                    </ListItem>
                ))}
            </List>

            <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                <GlowButton
                    variant="outlined"
                    fullWidth
                    startIcon={<LogOut size={16} />}
                    onClick={onLogout}
                >
                    Logout
                </GlowButton>
            </Box>
        </StyledPaper>
    );
};

// File Upload Component
const FileUpload = ({ onFileUpload }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await api.upload(file);
            setUploadedFiles(prev => [...prev, { ...result, file }]);
            onFileUpload(result);
        } catch (error) {
            console.error('Upload failed:', error);
        }
        setUploading(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#38bdf8', mb: 3, fontWeight: 700 }}>
                Document Upload Hub
            </Typography>

            <StyledPaper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
                <Upload size={48} color="#38bdf8" style={{ marginBottom: 16 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Upload Learning Materials
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                    Drag and drop PDF files or click to browse
                </Typography>

                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                />
                <label htmlFor="file-upload">
                    <GlowButton component="span" disabled={uploading}>
                        {uploading ? 'Processing...' : 'Select PDF File'}
                    </GlowButton>
                </label>

                {uploading && (
                    <Box sx={{ mt: 3 }}>
                        <LinearProgress
                            sx={{
                                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#38bdf8'
                                }
                            }}
                        />
                        <Typography variant="body2" sx={{ color: '#38bdf8', mt: 1 }}>
                            Analyzing document...
                        </Typography>
                    </Box>
                )}
            </StyledPaper>

            {uploadedFiles.length > 0 && (
                <StyledPaper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ color: '#38bdf8', mb: 2 }}>
                        Recent Uploads
                    </Typography>
                    {uploadedFiles.map((file, index) => (
                        <Box key={index} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            backgroundColor: 'rgba(56, 189, 248, 0.05)',
                            borderRadius: '8px',
                            mb: 1
                        }}>
                            <FileText size={20} color="#38bdf8" />
                            <Typography sx={{ ml: 2, color: 'white', flex: 1 }}>
                                {file.title}
                            </Typography>
                            <Chip label="Ready" color="success" size="small" />
                        </Box>
                    ))}
                </StyledPaper>
            )}
        </Box>
    );
};

// Chat Interface Component
const ChatInterface = ({ documents }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await api.query(input, documents[0]?.id);
            const botMessage = {
                id: Date.now() + 1,
                text: response.answer,
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Query failed:', error);
        }
        setLoading(false);
    };

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" sx={{ color: '#38bdf8', mb: 3, fontWeight: 700 }}>
                AI Assistant
            </Typography>

            <StyledPaper sx={{ flex: 1, p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                    {messages.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Brain size={48} color="#38bdf8" />
                            <Typography variant="h6" sx={{ color: 'white', mt: 2, mb: 1 }}>
                                Ready to Assist
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                Ask me anything about your uploaded documents
                            </Typography>
                        </Box>
                    ) : (
                        messages.map((message) => (
                            <Box
                                key={message.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 2
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 2,
                                        maxWidth: '70%',
                                        backgroundColor: message.sender === 'user'
                                            ? 'linear-gradient(45deg, #0ea5e9, #38bdf8)'
                                            : 'rgba(55, 65, 81, 0.8)',
                                        color: 'white',
                                        borderRadius: message.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
                                    }}
                                >
                                    <Typography variant="body1">{message.text}</Typography>
                                </Paper>
                            </Box>
                        ))
                    )}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                            <Paper sx={{ p: 2, backgroundColor: 'rgba(55, 65, 81, 0.8)', borderRadius: '20px 20px 20px 5px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {[0, 1, 2].map((i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: '#38bdf8',
                                                    animation: 'pulse 1.5s infinite',
                                                    animationDelay: `${i * 0.2}s`,
                                                    '@keyframes pulse': {
                                                        '0%, 80%, 100%': { opacity: 0.3 },
                                                        '40%': { opacity: 1 }
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="body2" sx={{ ml: 2, color: '#38bdf8' }}>
                                        Thinking...
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me about your documents..."
                        variant="outlined"
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                borderRadius: '25px',
                                '& fieldset': { borderColor: 'rgba(56, 189, 248, 0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(56, 189, 248, 0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                                '& input': { color: 'white', padding: '12px 20px' }
                            }
                        }}
                    />
                    <GlowButton
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        sx={{ borderRadius: '25px', minWidth: '60px' }}
                    >
                        <Send size={20} />
                    </GlowButton>
                </Box>
            </StyledPaper>
        </Box>
    );
};

// Flashcard Viewer Component
const FlashcardViewer = ({ documents }) => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [generating, setGenerating] = useState(false);

    const generateFlashcards = async (count = 5) => {
        if (!documents.length) return;

        setGenerating(true);
        try {
            const result = await api.generateFlashcards(documents[0].id, count);
            setFlashcards(result.flashcards);
            setCurrentCard(0);
            setFlipped(false);
        } catch (error) {
            console.error('Failed to generate flashcards:', error);
        }
        setGenerating(false);
    };

    const nextCard = () => {
        setCurrentCard((prev) => (prev + 1) % flashcards.length);
        setFlipped(false);
    };

    const prevCard = () => {
        setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        setFlipped(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#38bdf8', mb: 3, fontWeight: 700 }}>
                Memory Cards
            </Typography>

            {flashcards.length === 0 ? (
                <StyledPaper sx={{ p: 4, textAlign: 'center' }}>
                    <CreditCard size={48} color="#38bdf8" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Generate Flashcards
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                        Create study cards from your uploaded documents
                    </Typography>
                    <GlowButton
                        onClick={() => generateFlashcards()}
                        disabled={generating || !documents.length}
                    >
                        {generating ? 'Generating...' : 'Create Flashcards'}
                    </GlowButton>
                </StyledPaper>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                            Card {currentCard + 1} of {flashcards.length}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <GlowButton variant="outlined" onClick={() => generateFlashcards()}>
                                Generate New Set
                            </GlowButton>
                        </Box>
                    </Box>

                    <StyledPaper
                        sx={{
                            p: 4,
                            minHeight: '300px',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                        onClick={() => setFlipped(!flipped)}
                    >
                        <Typography variant="body2" sx={{ color: '#38bdf8', mb: 2, textAlign: 'center' }}>
                            {flipped ? 'ANSWER' : 'QUESTION'}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center', lineHeight: 1.6 }}>
                            {flipped ? flashcards[currentCard]?.answer : flashcards[currentCard]?.question}
                        </Typography>
                        {!flipped && (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', mt: 3 }}>
                                Click to reveal answer
                            </Typography>
                        )}
                    </StyledPaper>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                        <GlowButton variant="outlined" onClick={prevCard}>
                            Previous
                        </GlowButton>
                        <GlowButton variant="outlined" onClick={() => setFlipped(!flipped)}>
                            {flipped ? 'Show Question' : 'Show Answer'}
                        </GlowButton>
                        <GlowButton variant="outlined" onClick={nextCard}>
                            Next
                        </GlowButton>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// Document List Component
const DocumentList = ({ documents, onDocumentSelect }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#38bdf8', mb: 3, fontWeight: 700 }}>
                Document Library
            </Typography>

            <Grid container spacing={3}>
                {documents.map((doc, index) => (
                    <Grid item xs={12} md={6} lg={4} key={doc.id}>
                        <StyledPaper
                            sx={{
                                p: 3,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}
                            onClick={() => onDocumentSelect(doc)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <FileText size={24} color="#38bdf8" />
                                <Typography variant="h6" sx={{ ml: 2, color: 'white', flex: 1 }}>
                                    {doc.title}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                                Uploaded {new Date().toLocaleDateString()}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip label="PDF" size="small" sx={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }} />
                                <Chip label="Ready" size="small" sx={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }} />
                            </Box>
                        </StyledPaper>
                    </Grid>
                ))}
            </Grid>

            {documents.length === 0 && (
                <StyledPaper sx={{ p: 4, textAlign: 'center' }}>
                    <FileText size={48} color="rgba(255,255,255,0.3)" />
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                        No Documents Yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Upload your first document to get started
                    </Typography>
                </StyledPaper>
            )}
        </Box>
    );
};

// Analytics Panel Component
const AnalyticsPanel = ({ documents }) => {
    const stats = {
        totalDocuments: documents.length,
        totalQueries: 15,
        totalFlashcards: 45,
        studyTime: '12h 30m'
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#38bdf8', mb: 3, fontWeight: 700 }}>
                Learning Analytics
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { icon: FileText, label: 'Documents', value: stats.totalDocuments, color: '#38bdf8' },
                    { icon: "", label: 'Queries', value: stats.totalQueries, color: '#22c55e' },
                    { icon: CreditCard, label: 'Flashcards', value: stats.totalFlashcards, color: '#f59e0b' },
                    { icon: Clock, label: 'Study Time', value: stats.studyTime, color: '#8b5cf6' },
                ].map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <StyledPaper sx={{ p: 3, textAlign: 'center' }}>
                            <stat.icon size={32} color={stat.color} />
                            <Typography variant="h4" sx={{ color: 'white', mt: 2, fontWeight: 700 }}>
                                {stat.value}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {stat.label}
                            </Typography>
                        </StyledPaper>
                    </Grid>
                ))}
            </Grid>

            <StyledPaper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: '#38bdf8', mb: 3 }}>
                    Recent Activity
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                        'Generated 5 flashcards from "Machine Learning Basics.pdf"',
                        'Asked 3 questions about neural networks',
                        'Uploaded new document "Deep Learning Guide.pdf"',
                        'Completed flashcard review session'
                    ].map((activity, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px' }}>
                            <Activity size={16} color="#38bdf8" />
                            <Typography sx={{ ml: 2, color: 'white' }}>{activity}</Typography>
                            <Typography sx={{ ml: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                {index + 1}h ago
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </StyledPaper>
        </Box>
    );
};

// Main Dashboard Component
const Dashboard = () => {
    const [selectedTab, setSelectedTab] = useState('upload');
    const [documents, setDocuments] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleFileUpload = (newDoc) => {
        setDocuments(prev => [...prev, newDoc]);
        setSnackbar({ open: true, message: 'Document uploaded successfully!', severity: 'success' });
    };

    const handleLogout = () => {
        // Implement logout logic
        console.log('Logging out...');
    };

    const renderContent = () => {
        switch (selectedTab) {
            case 'upload':
                return <FileUpload onFileUpload={handleFileUpload} />;
            case 'chat':
                return <ChatInterface documents={documents} />;
            case 'flashcards':
                return <FlashcardViewer documents={documents} />;
            case 'documents':
                return <DocumentList documents={documents} onDocumentSelect={(doc) => console.log('Selected:', doc)} />;
            case 'analytics':
                return <AnalyticsPanel documents={documents} />;
            default:
                return <FileUpload onFileUpload={handleFileUpload} />;
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }
        }}>
            {/* Sidebar */}
            <Box sx={{ width: 280, flexShrink: 0 }}>
                <Sidebar
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    onLogout={handleLogout}
                />
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {renderContent()}
            </Box>

            {/* Floating Action Button for Quick Actions */}
            <Fab
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    background: 'linear-gradient(45deg, #0ea5e9, #38bdf8)',
                    color: 'white',
                    '&:hover': {
                        background: 'linear-gradient(45deg, #0284c7, #0ea5e9)',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
                }}
                onClick={() => setSelectedTab('upload')}
            >
                <Plus size={24} />
            </Fab>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: 'white',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        '& .MuiAlert-icon': {
                            color: '#38bdf8'
                        }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// Auth Hook
const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate auth check
        setTimeout(() => {
            setUser({ id: '1', name: 'Demo User' });
            setLoading(false);
        }, 1000);
    }, []);

    const login = async (credentials) => {
        // Simulate login
        setUser({ id: '1', name: credentials.username });
        return { success: true };
    };

    const logout = () => {
        setUser(null);
    };

    return { user, loading, login, logout };
};

// Login Component
const LoginPage = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onLogin(credentials);
        setLoading(false);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }
        }}>
            <StyledPaper sx={{ p: 4, width: '100%', maxWidth: 400, zIndex: 1 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(45deg, #0ea5e9, #38bdf8)',
                        fontSize: '2rem'
                    }}>
                        <Brain />
                    </Avatar>
                    <Typography variant="h4" sx={{ color: '#38bdf8', fontWeight: 700, mb: 1 }}>
                        NEXUS AI
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Advanced Learning Assistant
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                '& fieldset': { borderColor: 'rgba(56, 189, 248, 0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(56, 189, 248, 0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                                '& input': { color: 'white' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#38bdf8' }
                        }}
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        sx={{
                            mb: 4,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                '& fieldset': { borderColor: 'rgba(56, 189, 248, 0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(56, 189, 248, 0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                                '& input': { color: 'white' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#38bdf8' }
                        }}
                    />
                    <GlowButton
                        type="submit"
                        fullWidth
                        disabled={loading}
                        sx={{ mb: 2, py: 1.5 }}
                    >
                        {loading ? 'Authenticating...' : 'Access System'}
                    </GlowButton>
                </form>

                <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    Demo credentials: admin / password
                </Typography>
            </StyledPaper>
        </Box>
    );
};

export default Dashboard;