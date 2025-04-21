import React, { useState } from 'react';
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
  IconButton
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
import './ResultPage.css';

const ProgressDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useMediaQuery('(max-width:768px)');
  const isTablet = useMediaQuery('(max-width:1024px)');

  // Dummy data for the dashboard
  const progressData = {
    studentName: "Alex Johnson",
    recentActivity: "Completed Practice Quiz: Calculus Fundamentals",
    enrolledCourses: 4,
    completedCourses: 2,
    overallProgress: 68,  // percentage
    
    courseProgress: [
      { 
        courseId: "c1", 
        courseTitle: "Mathematics 301", 
        progress: 75, 
        modules: 12,
        completedModules: 9,
        lastAccessed: "2 days ago",
        nextActivity: "Final Exam",
        instructorName: "Prof. Sarah Williams"
      },
      { 
        courseId: "c2", 
        courseTitle: "Physics 202", 
        progress: 60, 
        modules: 10,
        completedModules: 6,
        lastAccessed: "Yesterday",
        nextActivity: "Lab Assignment",
        instructorName: "Dr. Robert Chen"
      },
      { 
        courseId: "c3", 
        courseTitle: "Computer Science 401", 
        progress: 45, 
        modules: 8,
        completedModules: 4,
        lastAccessed: "5 days ago",
        nextActivity: "Programming Project",
        instructorName: "Prof. James Thompson"
      },
      { 
        courseId: "c4", 
        courseTitle: "Chemistry Basics", 
        progress: 92, 
        modules: 6,
        completedModules: 5,
        lastAccessed: "1 week ago",
        nextActivity: "Final Quiz",
        instructorName: "Dr. Emily Rodriguez"
      }
    ],
    
    examResults: [
      {
        examId: "e1",
        examTitle: "Advanced Mathematics Final Exam",
        courseTitle: "Mathematics 301",
        date: "June 15, 2023",
        totalMarks: 100,
        marksAwarded: 78,
        status: "pass",
        sections: [
          {
            sectionName: "Algebra",
            maxMarks: 30,
            marksAwarded: 24
          },
          {
            sectionName: "Calculus",
            maxMarks: 40,
            marksAwarded: 28
          },
          {
            sectionName: "Statistics",
            maxMarks: 30,
            marksAwarded: 26
          }
        ]
      },
      {
        examId: "e2",
        examTitle: "Physics Mid-Term Exam",
        courseTitle: "Physics 202",
        date: "April 10, 2023",
        totalMarks: 80,
        marksAwarded: 62,
        status: "pass",
        sections: [
          {
            sectionName: "Mechanics",
            maxMarks: 30,
            marksAwarded: 22
          },
          {
            sectionName: "Thermodynamics",
            maxMarks: 25,
            marksAwarded: 18
          },
          {
            sectionName: "Optics",
            maxMarks: 25,
            marksAwarded: 22
          }
        ]
      }
    ],
    
    quizResults: [
      {
        quizId: "q1",
        quizTitle: "Calculus Quiz 3",
        courseTitle: "Mathematics 301",
        date: "May 20, 2023",
        totalQuestions: 15,
        correctAnswers: 13,
        score: 86.7,
        status: "pass"
      },
      {
        quizId: "q2",
        quizTitle: "Data Structures Quiz",
        courseTitle: "Computer Science 401",
        date: "May 15, 2023",
        totalQuestions: 20,
        correctAnswers: 17,
        score: 85,
        status: "pass"
      },
      {
        quizId: "q3",
        quizTitle: "Thermodynamics Quiz",
        courseTitle: "Physics 202",
        date: "May 5, 2023",
        totalQuestions: 10,
        correctAnswers: 7,
        score: 70,
        status: "pass"
      }
    ],
    
    practiceQuizzes: [
      {
        quizId: "pq1",
        quizTitle: "Calculus Practice 2",
        courseTitle: "Mathematics 301",
        date: "June 2, 2023",
        attemptsCount: 2,
        bestScore: 90,
        lastScore: 90
      },
      {
        quizId: "pq2",
        quizTitle: "Algorithms Practice",
        courseTitle: "Computer Science 401",
        date: "May 28, 2023",
        attemptsCount: 3,
        bestScore: 85,
        lastScore: 80
      },
      {
        quizId: "pq3",
        quizTitle: "Organic Chemistry Basics",
        courseTitle: "Chemistry Basics",
        date: "May 25, 2023",
        attemptsCount: 1,
        bestScore: 75,
        lastScore: 75
      }
    ],
    
    activityTimeline: [
      { date: "June 15, 2023", activity: "Completed Final Exam", course: "Mathematics 301", score: "78%" },
      { date: "June 10, 2023", activity: "Completed Module 9", course: "Mathematics 301", score: null },
      { date: "June 2, 2023", activity: "Took Practice Quiz", course: "Mathematics 301", score: "90%" },
      { date: "May 28, 2023", activity: "Completed Assignment", course: "Computer Science 401", score: "88%" },
      { date: "May 25, 2023", activity: "Took Practice Quiz", course: "Chemistry Basics", score: "75%" },
      { date: "May 20, 2023", activity: "Took Quiz", course: "Mathematics 301", score: "86.7%" },
      { date: "May 15, 2023", activity: "Took Quiz", course: "Computer Science 401", score: "85%" },
    ]
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

  const renderTabContent = () => {
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
        <Grid item xs={12} sm={6} md={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <MenuBook className="summary-card-icon" />
                <Typography variant="h6">Courses</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {progressData.completedCourses}/{progressData.enrolledCourses}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Courses Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <Assignment className="summary-card-icon" />
                <Typography variant="h6">Exams</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {progressData.examResults.filter(exam => exam.status === "pass").length}/{progressData.examResults.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Exams Passed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <Quiz className="summary-card-icon" />
                <Typography variant="h6">Quizzes</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {progressData.quizResults.filter(quiz => quiz.status === "pass").length}/{progressData.quizResults.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Quizzes Passed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="summary-card">
            <CardContent>
              <Box className="summary-card-header">
                <Timeline className="summary-card-icon" />
                <Typography variant="h6">Overall</Typography>
              </Box>
              <Typography variant="h3" className="summary-number">
                {progressData.overallProgress}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall Progress
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
                {progressData.recentActivity}
              </Typography>
              <Box className="overall-progress-bar-container">
                <Typography variant="body2" className="progress-label">
                  Overall Progress
                </Typography>
                <Box className="progress-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={progressData.overallProgress} 
                    className="overall-progress-bar"
                    sx={{ 
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getColorByPercentage(progressData.overallProgress)
                      }
                    }}
                  />
                  <Typography variant="body2" className="progress-percentage">
                    {progressData.overallProgress}%
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

        {progressData.courseProgress.slice(0, 2).map((course, index) => (
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
                  <Typography variant="body2" className="course-stat-item">
                    <span className="stat-label">Next:</span> {course.nextActivity}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} className="view-all-container">
          <Button 
            variant="outlined" 
            color="primary" 
            className="view-all-button"
            onClick={() => setActiveTab(1)}
          >
            View All Courses
          </Button>
        </Grid>

        {/* Latest Results */}
        <Grid item xs={12}>
          <Typography variant="h6" className="section-title">
            Latest Results
          </Typography>
        </Grid>

        {/* Latest Exam Result */}
        {progressData.examResults.length > 0 && (
          <Grid item xs={12} sm={6}>
            <Card className="result-card">
              <CardContent>
                <Box className="result-card-header">
                  <Box>
                    <Typography variant="h6" className="result-title">
                      {progressData.examResults[0].examTitle}
                    </Typography>
                    <Typography variant="body2" className="result-course">
                      {progressData.examResults[0].courseTitle}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={progressData.examResults[0].status === "pass" ? <CheckCircle /> : <Cancel />}
                    label={progressData.examResults[0].status === "pass" ? "PASSED" : "FAILED"}
                    className={`status-chip ${progressData.examResults[0].status}`}
                  />
                </Box>
                <Box className="result-score">
                  <Typography variant="h4" className="score-text">
                    {Math.round((progressData.examResults[0].marksAwarded / progressData.examResults[0].totalMarks) * 100)}%
                  </Typography>
                  <Typography variant="body2" className="marks-text">
                    {progressData.examResults[0].marksAwarded}/{progressData.examResults[0].totalMarks} marks
                  </Typography>
                </Box>
                <Typography variant="body2" className="result-date">
                  Taken on {progressData.examResults[0].date}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  className="view-result-button"
                  onClick={() => setActiveTab(2)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Latest Quiz Result */}
        {progressData.quizResults.length > 0 && (
          <Grid item xs={12} sm={6}>
            <Card className="result-card">
              <CardContent>
                <Box className="result-card-header">
                  <Box>
                    <Typography variant="h6" className="result-title">
                      {progressData.quizResults[0].quizTitle}
                    </Typography>
                    <Typography variant="body2" className="result-course">
                      {progressData.quizResults[0].courseTitle}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={progressData.quizResults[0].status === "pass" ? <CheckCircle /> : <Cancel />}
                    label={progressData.quizResults[0].status === "pass" ? "PASSED" : "FAILED"}
                    className={`status-chip ${progressData.quizResults[0].status}`}
                  />
                </Box>
                <Box className="result-score">
                  <Typography variant="h4" className="score-text">
                    {progressData.quizResults[0].score}%
                  </Typography>
                  <Typography variant="body2" className="marks-text">
                    {progressData.quizResults[0].correctAnswers}/{progressData.quizResults[0].totalQuestions} questions
                  </Typography>
                </Box>
                <Typography variant="body2" className="result-date">
                  Taken on {progressData.quizResults[0].date}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  className="view-result-button"
                  onClick={() => setActiveTab(3)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
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
        {progressData.courseProgress.map((course) => (
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
                  <Typography variant="body2" className="course-stat-item">
                    <span className="stat-label">Next:</span> {course.nextActivity}
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  className="course-action-button"
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
      <Grid container spacing={isMobile ? 2 : 3}>
        {progressData.examResults.map((exam) => (
          <Grid item xs={12} key={exam.examId}>
            <Card className="detailed-result-card">
              <CardContent>
                <Box className="detailed-result-header">
                  <Box>
                    <Typography variant="h6" className="result-title">
                      {exam.examTitle}
                    </Typography>
                    <Typography variant="body2" className="result-course">
                      {exam.courseTitle}
                    </Typography>
                  </Box>
                  <Box className="result-meta">
                    <Chip 
                      icon={exam.status === "pass" ? <CheckCircle /> : <Cancel />}
                      label={exam.status === "pass" ? "PASSED" : "FAILED"}
                      className={`status-chip ${exam.status}`}
                    />
                    <Typography variant="body2" className="result-date">
                      {exam.date}
                    </Typography>
                  </Box>
                </Box>
                
                <Box className="result-overall-score">
                  <Box 
                    className="score-circle"
                    style={{ 
                      backgroundColor: getColorByPercentage(Math.round((exam.marksAwarded / exam.totalMarks) * 100)),
                      color: '#fff'
                    }}
                  >
                    <Typography variant="h5">
                      {Math.round((exam.marksAwarded / exam.totalMarks) * 100)}%
                    </Typography>
                  </Box>
                  <Typography variant="body1" className="marks-text">
                    {exam.marksAwarded}/{exam.totalMarks} marks
                  </Typography>
                </Box>
                
                <Typography variant="subtitle1" className="sections-title">
                  Section Breakdown
                </Typography>
                <Box className="section-breakdown">
                  {exam.sections.map((section, index) => {
                    const sectionPercentage = (section.marksAwarded / section.maxMarks) * 100;
                    return (
                      <Box key={index} className="section-item">
                        <Box className="section-header">
                          <Typography variant="body2" className="section-name">
                            {section.sectionName}
                          </Typography>
                          <Typography variant="body2" className="section-score">
                            {section.marksAwarded}/{section.maxMarks}
                          </Typography>
                        </Box>
                        <Box className="progress-container">
                          <LinearProgress 
                            variant="determinate" 
                            value={sectionPercentage} 
                            className="section-progress-bar"
                            sx={{ 
                              backgroundColor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getColorByPercentage(sectionPercentage)
                              }
                            }}
                          />
                          <Typography variant="body2" className="progress-percentage">
                            {Math.round(sectionPercentage)}%
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  className="view-detailed-button"
                >
                  View Detailed Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderQuizzesTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Quiz Results
      </Typography>
      <Grid container spacing={isMobile ? 2 : 3}>
        {progressData.quizResults.map((quiz) => (
          <Grid item xs={12} sm={6} md={4} key={quiz.quizId}>
            <Card className="quiz-result-card">
              <CardContent>
                <Box className="quiz-result-header">
                  <Typography variant="h6" className="quiz-title">
                    {quiz.quizTitle}
                  </Typography>
                  <Chip 
                    label={`${quiz.score}%`}
                    className="score-chip"
                    style={{ 
                      backgroundColor: getColorByPercentage(quiz.score),
                      color: '#fff'
                    }}
                  />
                </Box>
                <Typography variant="body2" className="quiz-course">
                  {quiz.courseTitle}
                </Typography>
                <Box className="quiz-details">
                  <Typography variant="body2" className="quiz-detail-item">
                    <span className="detail-label">Date:</span> {quiz.date}
                  </Typography>
                  <Typography variant="body2" className="quiz-detail-item">
                    <span className="detail-label">Correct Answers:</span> {quiz.correctAnswers}/{quiz.totalQuestions}
                  </Typography>
                  <Typography variant="body2" className="quiz-detail-item">
                    <span className="detail-label">Status:</span> 
                    <span className={`status-text ${quiz.status}`}>
                      {quiz.status.toUpperCase()}
                    </span>
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  className="review-quiz-button"
                >
                  Review Quiz
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderPracticeTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Practice Quizzes
      </Typography>
      <Grid container spacing={isMobile ? 2 : 3}>
        {progressData.practiceQuizzes.map((quiz) => (
          <Grid item xs={12} sm={6} md={4} key={quiz.quizId}>
            <Card className="practice-quiz-card">
              <CardContent>
                <Typography variant="h6" className="practice-title">
                  {quiz.quizTitle}
                </Typography>
                <Typography variant="body2" className="practice-course">
                  {quiz.courseTitle}
                </Typography>
                <Box className="practice-scores">
                  <Box className="practice-score-item">
                    <Typography variant="body2" className="score-label">Best Score</Typography>
                    <Typography 
                      variant="h6" 
                      className="score-value"
                      style={{ color: getColorByPercentage(quiz.bestScore) }}
                    >
                      {quiz.bestScore}%
                    </Typography>
                  </Box>
                  <Box className="practice-score-item">
                    <Typography variant="body2" className="score-label">Last Score</Typography>
                    <Typography 
                      variant="h6" 
                      className="score-value"
                      style={{ color: getColorByPercentage(quiz.lastScore) }}
                    >
                      {quiz.lastScore}%
                    </Typography>
                  </Box>
                </Box>
                <Box className="practice-details">
                  <Typography variant="body2" className="practice-detail-item">
                    <span className="detail-label">Last Attempt:</span> {quiz.date}
                  </Typography>
                  <Typography variant="body2" className="practice-detail-item">
                    <span className="detail-label">Total Attempts:</span> {quiz.attemptsCount}
                  </Typography>
                </Box>
                <Box className="practice-actions">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    className="practice-action-button"
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    className="practice-action-button"
                  >
                    Review
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTimelineTab = () => (
    <Box className="tab-content">
      <Typography variant="h6" className="section-title">
        Activity Timeline
      </Typography>
      <Paper className="timeline-container">
        {progressData.activityTimeline.map((activity, index) => (
          <Box key={index} className="timeline-item">
            <Box className="timeline-marker"></Box>
            <Box className="timeline-content">
              <Typography variant="body2" className="timeline-date">
                {activity.date}
              </Typography>
              <Typography variant="body1" className="timeline-activity">
                {activity.activity}
              </Typography>
              <Typography variant="body2" className="timeline-course">
                Course: {activity.course}
              </Typography>
              {activity.score && (
                <Chip 
                  label={activity.score}
                  size="small"
                  className="timeline-score-chip"
                  style={{ 
                    backgroundColor: getColorByPercentage(parseFloat(activity.score)),
                    color: '#fff'
                  }}
                />
              )}
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );

  return (
    <Container className="progress-dashboard-container" maxWidth={false}>
      <Box className="dashboard-header">
        <Box className="header-content">
          <Typography variant="h4" className="dashboard-title">Student Progress</Typography>
          <Typography variant="body1" className="student-name">
            <Person className="student-icon" /> {progressData.studentName}
          </Typography>
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

export default ProgressDashboard; 