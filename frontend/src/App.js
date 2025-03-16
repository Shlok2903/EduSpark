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
      </Routes>
    </Provider>
  );
}

export default App;