import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { examService } from '../../services/api';
import Sidebar from '../common/sidebar/Sidebar';
import { handleError, handleSuccess } from '../../utils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';

function ExamResults() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    passCount: 0,
    failCount: 0,
    notGradedCount: 0,
    totalAttempts: 0
  });
  const [tabValue, setTabValue] = useState(0);
  const [confirmDeleteAttempt, setConfirmDeleteAttempt] = useState(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [confirmSendEmails, setConfirmSendEmails] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchExamResults = async () => {
      setLoading(true);
      try {
        // Fetch exam details
        const examData = await examService.getExamById(examId);
        if (examData) {
          setExam(examData);
        }
        
        // Fetch exam attempts
        const attemptsData = await examService.getExamAttempts(examId);
        if (attemptsData) {
          setAttempts(attemptsData);
          
          // Calculate stats
          calculateStats(attemptsData, examData);
        }
      } catch (error) {
        console.error('Error fetching exam results:', error);
        handleError('Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchExamResults();
  }, [examId]);

  const calculateStats = (attemptsData, examData) => {
    if (!attemptsData.length || !examData) return;
    
    const gradedAttempts = attemptsData.filter(a => a.status === 'graded');
    
    let totalScore = 0;
    let highest = 0;
    let lowest = examData.totalMarks;
    
    gradedAttempts.forEach(attempt => {
      const score = attempt.score || 0;
      totalScore += score;
      highest = Math.max(highest, score);
      lowest = Math.min(lowest, score);
    });
    
    const average = gradedAttempts.length ? (totalScore / gradedAttempts.length).toFixed(2) : 0;
    const passCount = gradedAttempts.filter(a => {
      const percentage = ((a.score || 0) / examData.totalMarks) * 100;
      return percentage >= examData.passingPercentage;
    }).length;
    
    setStats({
      average,
      highest,
      lowest: gradedAttempts.length ? lowest : 0,
      passCount,
      failCount: gradedAttempts.length - passCount,
      notGradedCount: attemptsData.filter(a => a.status !== 'graded').length,
      totalAttempts: attemptsData.length
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewAttempt = (attemptId) => {
    navigate(`/exams/attempt/${attemptId}`);
  };

  const handleDeleteAttempt = async () => {
    if (!confirmDeleteAttempt) return;
    
    setDeleting(true);
    try {
      await examService.deleteAttempt(confirmDeleteAttempt);
      handleSuccess('Attempt deleted successfully');
      setAttempts(attempts.filter(a => a._id !== confirmDeleteAttempt));
      
      // Recalculate stats
      calculateStats(
        attempts.filter(a => a._id !== confirmDeleteAttempt),
        exam
      );
    } catch (error) {
      console.error('Error deleting attempt:', error);
      handleError('Failed to delete attempt');
    } finally {
      setDeleting(false);
      setConfirmDeleteAttempt(null);
    }
  };

  const handleSendEmails = async () => {
    setSendingEmails(true);
    try {
      await examService.sendResultEmails(examId, { message: emailMessage });
      handleSuccess('Results emails sent successfully');
      setConfirmSendEmails(false);
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending emails:', error);
      handleError('Failed to send result emails');
    } finally {
      setSendingEmails(false);
    }
  };

  const handleDownloadResults = async () => {
    try {
      const response = await examService.downloadResults(examId);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exam.title}-results.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading results:', error);
      handleError('Failed to download results');
    }
  };

  const getAttemptStatusText = (status) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'timed-out':
        return 'Timed Out';
      case 'graded':
        return 'Graded';
      default:
        return 'Unknown';
    }
  };

  const getAttemptStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'warning';
      case 'submitted':
        return 'info';
      case 'timed-out':
        return 'error';
      case 'graded':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''}${mins ? ` ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
    }
  };

  const getPassFailStatus = (attempt) => {
    if (attempt.status !== 'graded' || !exam) return null;
    
    const percentage = ((attempt.score || 0) / exam.totalMarks) * 100;
    const isPassed = percentage >= exam.passingPercentage;
    
    return (
      <Chip 
        label={isPassed ? 'Passed' : 'Failed'}
        color={isPassed ? 'success' : 'error'}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!exam) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Alert severity="error">Exam not found or you don't have permission to view results.</Alert>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/exams')}
            sx={{ mt: 2 }}
          >
            Back to Exams
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
      <Sidebar />
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/exams')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {exam.title} - Results
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadResults}
              sx={{ mr: 2 }}
            >
              Download CSV
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => setConfirmSendEmails(true)}
            >
              Email Results
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Attempts</Typography>
                <Typography variant="h3" color="primary">{stats.totalAttempts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Average Score</Typography>
                <Typography variant="h3" color="primary">
                  {stats.average} / {exam.totalMarks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.average > 0 ? `${((stats.average / exam.totalMarks) * 100).toFixed(1)}%` : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pass Rate</Typography>
                <Typography variant="h3" color="primary">
                  {stats.totalAttempts > 0 
                    ? `${((stats.passCount / stats.totalAttempts) * 100).toFixed(1)}%` 
                    : '0%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.passCount} passed, {stats.failCount} failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Score Range</Typography>
                <Typography variant="h3" color="primary">
                  {stats.lowest} - {stats.highest}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of {exam.totalMarks} marks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="All Attempts" />
          <Tab label="Graded" />
          <Tab label="Pending" />
          <Tab label="In Progress" />
        </Tabs>
        
        {attempts.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Started At</TableCell>
                  <TableCell>Submitted At</TableCell>
                  <TableCell>Time Spent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts
                  .filter(attempt => {
                    if (tabValue === 0) return true;
                    if (tabValue === 1) return attempt.status === 'graded';
                    if (tabValue === 2) return ['submitted', 'timed-out'].includes(attempt.status);
                    if (tabValue === 3) return attempt.status === 'in-progress';
                    return true;
                  })
                  .map((attempt) => (
                    <TableRow key={attempt._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {attempt.studentId?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attempt.studentId?.email || 'No email'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(attempt.startTime)}</TableCell>
                      <TableCell>
                        {attempt.submittedAt ? formatDate(attempt.submittedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        {attempt.timeSpent 
                          ? `${Math.floor(attempt.timeSpent / 60)} min ${attempt.timeSpent % 60} sec` 
                          : attempt.status === 'in-progress' 
                            ? 'In progress' 
                            : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getAttemptStatusText(attempt.status)} 
                          color={getAttemptStatusColor(attempt.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {attempt.status === 'graded' 
                          ? `${attempt.score} / ${exam.totalMarks}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {getPassFailStatus(attempt)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Attempt">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewAttempt(attempt._id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Attempt">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => setConfirmDeleteAttempt(attempt._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No attempts found for this exam.
          </Alert>
        )}
      </Box>
      
      {/* Confirmation Dialogs */}
      <Dialog
        open={!!confirmDeleteAttempt}
        onClose={() => setConfirmDeleteAttempt(null)}
      >
        <DialogTitle>Delete Attempt</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this attempt? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteAttempt(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAttempt} 
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={confirmSendEmails}
        onClose={() => setConfirmSendEmails(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Email Results to Students</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Send exam results to all students who have completed this exam. The email will include their score and whether they passed or failed.
          </DialogContentText>
          
          <TextField
            label="Additional Message (Optional)"
            multiline
            rows={4}
            fullWidth
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            placeholder="Add a personal message to include in the result emails..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSendEmails(false)} disabled={sendingEmails}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmails} 
            color="primary"
            variant="contained"
            disabled={sendingEmails}
          >
            {sendingEmails ? 'Sending...' : 'Send Emails'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExamResults; 