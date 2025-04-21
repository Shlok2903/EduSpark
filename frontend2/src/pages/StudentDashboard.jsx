import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Chip,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  useMediaQuery,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel,
  BarChart,
  Assignment,
  Person,
  Timeline,
  School,
  LibraryBooks,
  Quiz,
  MenuBook,
  ArrowBack,
  ArrowForward,
  CalendarMonth
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import './ResultPage.css'; // Reuse the existing styles

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useMediaQuery('(max-width:768px)');
  const isTablet = useMediaQuery('(max-width:1024px)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentService.getDashboard();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to determine color based on percentage
  const getColorByPercentage = (percent) => {
    if (percent >= 80) return "#4CAF50"; // Green
    if (percent >= 60) return "#8BC34A"; // Light Green
    if (percent >= 40) return "#FFC107"; // Amber
    return "#F44336"; // Red
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewExamResult = (attemptId) => {
    navigate(`/exams/result/${attemptId}`);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ padding: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }

    if (!dashboardData) {
      return (
        <Box sx={{ padding: 4 }}>
          <Alert severity="info">No dashboard data available.</Alert>
        </Box>
      );
    }

    switch (activeTab) {
      case 0: 
        return renderOverviewTab();
      case 1: 
        return renderCoursesTab();
      case 2: 
        return renderExamsTab();
      case 3: 
        return renderQuizzesTab();
      case 4: 
        return renderPracticeTab();
      case 5:
        return renderTimelineTab();
      default: 
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <Box className="tab-content">
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Summary Cards */}
        <Grid item xs={6} sm={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <LibraryBooks className="summary-card-icon" />
                <Typography variant="body1">Enrolled Courses</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {dashboardData.enrolledCourses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <CheckCircle className="summary-card-icon" />
                <Typography variant="body1">Completed</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {dashboardData.completedCourses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <Assignment className="summary-card-icon" />
                <Typography variant="body1">Last Exam Score</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {dashboardData.examResults && dashboardData.examResults.length > 0 
                  ? `${dashboardData.examResults[0].percentage}%` 
                  : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <School className="summary-card-icon" />
                <Typography variant="body1">Overall Progress</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {dashboardData.overallProgress}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity & Progress */}
        <Grid item xs={12}>
          <Paper className="recent-activity-paper">
            <Box className="card-header">
              <CalendarMonth className="header-icon" />
              <Typography variant="h6">Recent Activity</Typography>
            </Box>
            <Divider />
            <Box className="recent-activity-content">
              <Typography variant="body1" className="recent-activity-text">
                {dashboardData.recentActivity}
              </Typography>
              <Box className="overall-progress-bar-container">
                <Typography variant="body2" className="progress-label">
                  Overall Progress
                </Typography>
                <Box className="progress-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={dashboardData.overallProgress} 
                    className="overall-progress-bar"
                    sx={{ 
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getColorByPercentage(dashboardData.overallProgress)
                      }
                    }}
                  />
                  <Typography variant="body2" className="progress-percentage">
                    {dashboardData.overallProgress}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Course Progress Cards (Featured) */}
        <Grid item xs={12}>
          <Typography variant="h6" className="section-title">
            Course Progress
          </Typography>
        </Grid>

        {dashboardData.courseProgress && dashboardData.courseProgress.slice(0, 2).map((course, index) => (
          <Grid item xs={12} sm={6} key={course.courseId}>
            <Card className="course-progress-card">
              <CardContent>
                <Typography variant="h6" className="course-title">
                  {course.courseTitle}
                </Typography>
                <Typography variant="body2" className="instructor-name">
                  Instructor: {course.instructorName}
                </Typography>
                <Box className="progress-container course-progress-bar-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={course.progress} 
                    className="course-progress-bar"
                    sx={{ 
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getColorByPercentage(course.progress)
                      }
                    }}
                  />
                  <Typography variant="body2" className="progress-percentage">
                    {course.progress}%
                  </Typography>
                </Box>
                <Box className="course-stats">
                  <Typography variant="body2" className="course-stat-item">
                    <span className="stat-label">Modules:</span> {course.completedModules}/{course.modules}
                  </Typography>
                  <Typography variant="body2" className="course-stat-item">
                    <span className="stat-label">Last Accessed:</span> {course.lastAccessed}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleViewCourse(course.courseId)}
                  style={{ marginTop: '8px' }}
                >
                  Continue Learning
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Recent Exam Results */}
        {dashboardData.examResults && dashboardData.examResults.length > 0 && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" className="section-title">
                Recent Exam Results
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card className="exam-results-card">
                <Box className="exam-result-header">
                  <Typography variant="body1" className="exam-title">
                    {dashboardData.examResults[0].examTitle}
                  </Typography>
                  <Chip 
                    label={dashboardData.examResults[0].status === 'pass' ? 'Passed' : 'Failed'} 
                    variant="outlined"
                    color={dashboardData.examResults[0].status === 'pass' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Box className="exam-result-detail">
                  <Typography variant="body2">
                    Course: {dashboardData.examResults[0].courseTitle}
                  </Typography>
                  <Typography variant="body2">
                    Score: {dashboardData.examResults[0].marksAwarded} / {dashboardData.examResults[0].totalMarks} ({dashboardData.examResults[0].percentage}%)
                  </Typography>
                  <Typography variant="body2">
                    Date: {dashboardData.examResults[0].date}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleViewExamResult(dashboardData.examResults[0].attemptId)}
                  style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                >
                  View Details
                </Button>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );

  const renderCoursesTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        My Courses
      </Typography>
      <Grid container spacing={isMobile ? 2 : 3}>
        {dashboardData.courseProgress && dashboardData.courseProgress.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.courseId}>
            <Card className="course-progress-card">
              <CardContent>
                <Typography variant="h6" className="course-title">
                  {course.courseTitle}
                </Typography>
                <Typography variant="body2" className="instructor-name">
                  Instructor: {course.instructorName}
                </Typography>
                <Box className="progress-container course-progress-bar-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={course.progress} 
                    className="course-progress-bar"
                    sx={{ 
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getColorByPercentage(course.progress)
                      }
                    }}
                  />
                  <Typography variant="body2" className="progress-percentage">
                    {course.progress}%
                  </Typography>
                </Box>
                <Box className="course-stats">
                  <Typography variant="body2" className="course-stat-item">
                    <span className="stat-label">Modules:</span> {course.completedModules}/{course.modules}
                  </Typography>
                  <Typography variant="body2" className="course-stat-item">
                    <span className="stat-label">Last Accessed:</span> {course.lastAccessed}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleViewCourse(course.courseId)}
                  style={{ marginTop: '8px' }}
                >
                  Continue Learning
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderExamsTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Exam Results
      </Typography>
      {dashboardData.examResults && dashboardData.examResults.length > 0 ? (
        <Grid container spacing={isMobile ? 2 : 3}>
          {dashboardData.examResults.map((exam) => (
            <Grid item xs={12} md={6} key={exam.examId}>
              <Card className="exam-result-card">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" className="exam-title">
                      {exam.examTitle}
                    </Typography>
                    <Chip 
                      label={exam.status === 'pass' ? 'Passed' : 'Failed'} 
                      color={exam.status === 'pass' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {exam.courseTitle}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Date: {exam.date}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Score: {exam.marksAwarded}/{exam.totalMarks} ({exam.percentage}%)
                  </Typography>
                  
                  {exam.sections && exam.sections.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Section Breakdown:
                      </Typography>
                      {exam.sections.map((section, idx) => (
                        <Box key={idx} mt={1}>
                          <Typography variant="body2">
                            {section.sectionName}: {section.marksAwarded}/{section.maxMarks} points
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(section.marksAwarded / section.maxMarks) * 100} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              mt: 0.5,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getColorByPercentage((section.marksAwarded / section.maxMarks) * 100)
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => handleViewExamResult(exam.attemptId)}
                    sx={{ mt: 2 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">You haven't taken any exams yet.</Alert>
      )}
    </Box>
  );

  const renderQuizzesTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Quiz Results
      </Typography>
      {dashboardData.quizResults && dashboardData.quizResults.length > 0 ? (
        <Grid container spacing={isMobile ? 2 : 3}>
          {dashboardData.quizResults.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.quizId}>
              <Card className="quiz-result-card">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" className="quiz-title">
                      {quiz.quizTitle}
                    </Typography>
                    <Chip 
                      label={quiz.status === 'pass' ? 'Passed' : 'Failed'} 
                      color={quiz.status === 'pass' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {quiz.courseTitle}
                  </Typography>
                  <Box mt={1}>
                    <Typography variant="body2">
                      Date: {quiz.date}
                    </Typography>
                    <Typography variant="body2">
                      Score: {quiz.score}%
                    </Typography>
                    <Typography variant="body2">
                      Correct Answers: {quiz.correctAnswers}/{quiz.totalQuestions}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">You haven't taken any quizzes yet.</Alert>
      )}
    </Box>
  );

  const renderPracticeTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Practice Quiz Results
      </Typography>
      <Alert severity="info">
        This feature is coming soon! You'll be able to view your practice quiz results here.
      </Alert>
    </Box>
  );

  const renderTimelineTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Activity Timeline
      </Typography>
      {dashboardData.activityTimeline && dashboardData.activityTimeline.length > 0 ? (
        <Box className="timeline-container">
          {dashboardData.activityTimeline.map((activity, index) => (
            <Paper key={index} className="timeline-item">
              <Box className="timeline-content">
                <Typography variant="body2" className="timeline-date">
                  {activity.date}
                </Typography>
                <Typography variant="body1" className="timeline-activity">
                  {activity.activity}
                </Typography>
                <Typography variant="body2" className="timeline-title">
                  {activity.title}
                </Typography>
                <Typography variant="body2" className="timeline-course">
                  {activity.course}
                </Typography>
                {activity.score && (
                  <Typography variant="body2" className="timeline-score">
                    Score: {activity.score}
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Alert severity="info">No recent activity found.</Alert>
      )}
    </Box>
  );

  return (
    <Container className="progress-dashboard-container" maxWidth={false}>
      <Box className="dashboard-header">
        <Box className="header-content">
          <Typography variant="h4" className="dashboard-title">Student Dashboard</Typography>
          {dashboardData && (
            <Typography variant="body1" className="student-name">
              <Person className="student-icon" /> {dashboardData.studentName}
            </Typography>
          )}
        </Box>
      </Box>

      <Paper className="main-content">
        <Box className="tabs-container">
          {isMobile ? (
            <>
              <Box className="mobile-tabs-header">
                <IconButton 
                  onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                  disabled={activeTab === 0}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h6" className="current-tab-name">
                  {['Overview', 'Courses', 'Exams', 'Quizzes', 'Practice', 'Timeline'][activeTab]}
                </Typography>
                <IconButton 
                  onClick={() => setActiveTab(Math.min(5, activeTab + 1))}
                  disabled={activeTab === 5}
                >
                  <ArrowForward />
                </IconButton>
              </Box>
            </>
          ) : (
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isTablet ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              className="dashboard-tabs"
            >
              <Tab icon={<BarChart />} label="Overview" />
              <Tab icon={<LibraryBooks />} label="Courses" />
              <Tab icon={<Assignment />} label="Exams" />
              <Tab icon={<Quiz />} label="Quizzes" />
              <Tab icon={<School />} label="Practice" />
              <Tab icon={<Timeline />} label="Timeline" />
            </Tabs>
          )}
        </Box>
        
        {renderTabContent()}
      </Paper>
    </Container>
  );
};

export default StudentDashboard; 