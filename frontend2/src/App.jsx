import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import store from './store/store';
import Login from './components/auth/login/Login';
import Home from './components/home/Home';
import MainLayout from './components/layouts/MainLayout';
import StudentCourses from './components/courses/student/StudentCourses';
import StudentCourseDetail from './components/courses/student/CourseDetail';
import TeacherCourseDetail from './components/courses/teacher/CourseDetail';
import ManageCourses from './components/courses/teacher/ManageCourses';
import AddCourse from './components/courses/teacher/AddCourse';
import AddSections from './components/courses/teacher/AddSections';
import AddContent from './components/courses/teacher/AddContent';
import StudentPractice from './components/practice/StudentPractice';
import ManageExams from './components/exams/teacher/ManageExams';
import CreateExam from './components/exams/teacher/CreateExam';
import StudentExams from './components/exams/student/StudentExams';
import TakeExam from './components/exams/student/TakeExam';
import ExamResult from './components/exams/student/ExamResult';
import './App.css';

// Create a custom theme for Material UI components
const theme = createTheme({
  palette: {
    primary: {
      main: '#FDC886',
    },
    secondary: {
      main: '#3498db',
    },
    background: {
      default: '#FAF9F6',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Protected route component for authenticated routes
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('jwtToken');
  return isAuthenticated ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

// Teacher-only protected route
const TeacherRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('jwtToken');
  const isTeacher = localStorage.getItem('isTutor') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isTeacher && !isAdmin) {
    return <Navigate to="/home" />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

// Student-only protected route
const StudentRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('jwtToken');
  const isTeacher = localStorage.getItem('isTutor') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If teacher or admin is trying to access student pages, redirect to their dashboard
  if (isTeacher || isAdmin) {
    return <Navigate to="/dashboard/manage-courses" />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Provider store={store}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes for all users */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              
              {/* Student Course Routes */}
              <Route
                path="/courses"
                element={
                  <StudentRoute>
                    <StudentCourses />
                  </StudentRoute>
                }
              />
              
              <Route
                path="/courses/:courseId"
                element={
                  <StudentRoute>
                    <StudentCourseDetail />
                  </StudentRoute>
                }
              />
              
              {/* Teacher/Admin Course Routes */}
              <Route
                path="/dashboard/manage-courses"
                element={
                  <TeacherRoute>
                    <ManageCourses />
                  </TeacherRoute>
                }
              />
              
              {/* Create course route must come before dynamic routes */}
              <Route
                path="/dashboard/courses/add"
                element={
                  <TeacherRoute>
                    <AddCourse />
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/dashboard/courses/edit/:courseId"
                element={
                  <TeacherRoute>
                    <div>Edit Course Page (Coming Soon)</div>
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/dashboard/courses/:courseId"
                element={
                  <TeacherRoute>
                    <TeacherCourseDetail />
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/add-course"
                element={
                  <TeacherRoute>
                    <AddCourse />
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/add-course/sections/:courseId"
                element={
                  <TeacherRoute>
                    <AddSections />
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/add-course/content/:courseId/:sectionId"
                element={
                  <TeacherRoute>
                    <AddContent />
                  </TeacherRoute>
                }
              />
              
              {/* Other Routes */}
              <Route
                path="/practice"
                element={
                  <StudentRoute>
                    <StudentPractice />
                  </StudentRoute>
                }
              />
              
              {/* Exam Routes - Student */}
              <Route
                path="/exams"
                element={
                  <StudentRoute>
                    <StudentExams />
                  </StudentRoute>
                }
              />
              
              <Route
                path="/exams/take/:examId"
                element={
                  <StudentRoute>
                    <TakeExam />
                  </StudentRoute>
                }
              />
              
              <Route
                path="/exams/result/:attemptId"
                element={
                  <StudentRoute>
                    <ExamResult />
                  </StudentRoute>
                }
              />
              
              {/* Exam Routes - Teacher */}
              <Route
                path="/exams/manage"
                element={
                  <TeacherRoute>
                    <ManageExams />
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/exams/create/:courseId"
                element={
                  <TeacherRoute>
                    <CreateExam />
                  </TeacherRoute>
                }
              />
              
              <Route
                path="/results"
                element={
                  <ProtectedRoute>
                    <div>Results Page (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
              
              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
            <ToastContainer position="bottom-right" />
          </Router>
        </Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
