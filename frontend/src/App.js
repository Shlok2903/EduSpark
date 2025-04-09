import React from 'react';
import { Provider } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import store from './store/store';
import PrivateRoute from './utils/PrivateRoute';
import Login from './components/auth/login/Login';
import Signup from './components/auth/signup/Signup';
import Home from './components/home/Home';
import Courses from './components/courses/courseList/CourseList';
import AddCourse from './components/courses/AddCourse';
import CourseDetail from './components/courses/CourseDetail';
import PracticePage from './components/practice/PracticePage';
import PracticeSession from './components/practice/PracticeSession';
import ExamsPage from './components/exams/ExamsPage';
import CreateExam from './components/exams/CreateExam';
import EditExam from './components/exams/EditExam';
import ExamSession from './components/exams/ExamSession';
import ExamView from './components/exams/ExamView';
import ExamResults from './components/exams/ExamResults';
import ExamAttemptView from './components/exams/ExamAttemptView';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/tutorsignup" element={<Signup isTutor={true} />} />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/home" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/courses" element={
          <PrivateRoute>
            <Courses />
          </PrivateRoute>
        } />
        <Route path="/add-course" element={
          <PrivateRoute adminOrTutorOnly={true}>
            <AddCourse />
          </PrivateRoute>
        } />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/practice" element={
          <PrivateRoute>
            <PracticePage />
          </PrivateRoute>
        } />
        <Route path="/practice/:practiceId" element={
          <PrivateRoute>
            <PracticeSession />
          </PrivateRoute>
        } />
        
        {/* Exam Routes */}
        <Route path="/exams" element={
          <PrivateRoute>
            <ExamsPage />
          </PrivateRoute>
        } />
        <Route path="/exams/create/:courseId" element={
          <PrivateRoute adminOrTutorOnly={true}>
            <CreateExam />
          </PrivateRoute>
        } />
        <Route path="/exams/edit/:examId" element={
          <PrivateRoute adminOrTutorOnly={true}>
            <EditExam />
          </PrivateRoute>
        } />
        <Route path="/exams/view/:examId" element={
          <PrivateRoute>
            <ExamView />
          </PrivateRoute>
        } />
        <Route path="/exams/session/:attemptId" element={
          <PrivateRoute>
            <ExamSession />
          </PrivateRoute>
        } />
        <Route path="/exams/results/:examId" element={
          <PrivateRoute adminOrTutorOnly={true}>
            <ExamResults />
          </PrivateRoute>
        } />
        <Route path="/exams/attempt/:attemptId" element={
          <PrivateRoute>
            <ExamAttemptView />
          </PrivateRoute>
        } />
      </Routes>
    </Provider>
  );
}

export default App;