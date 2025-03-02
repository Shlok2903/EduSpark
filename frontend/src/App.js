import React from 'react';
import { Provider } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import store from './store/store';
import PrivateRoute from './utils/PrivateRoute';
import Login from './components/auth/login/Login';
import Home from './components/home/Home';
import Courses from './components/courses/courseList/CourseList';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/login" element={<Login />} />
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
      </Routes>
    </Provider>
  );
}

export default App;