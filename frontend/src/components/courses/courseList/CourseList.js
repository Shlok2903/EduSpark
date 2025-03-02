import React from 'react';
import { Box, Typography, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AlertIcon from '../../../assets/alert.svg';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InProgressCard from '../CourseCard/InProgressCard';
import AvailableCourseCard from '../CourseCard/AvailableCourseCard';
import Sidebar from '../../common/sidebar/Sidebar';
import './Courses.css';
import test from './test.png';

function Courses() {
    return (
        <div className="home-container">
            <Sidebar />
            
            {/* Main Content */}
            <div className="main-content">
                <div className="header">
                    <Typography variant="h4" className="page-title">
                        Courses
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Box className="search-container">
                            <TextField
                                placeholder="Search any courses.."
                                variant="outlined"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#37474F' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                        <div className="alert-button">
                            <img src={AlertIcon} alt="Notifications" />
                        </div>
                    </Box>
                </div>
                <Box className="content-divider" />

                {/* In Progress Section */}
                <div className="courses-section">
                    <div className="section-header">
                        <Typography className="section-title">In Progress</Typography>
                        <Typography className="courses-count">3 Courses in progress</Typography>
                    </div>
                    <div className="courses-slider">
                        <div className="courses-container">
                            <InProgressCard
                                title="The Complete Python Developer Course Advanced"
                                tutor="Dr. Angela Yu"
                                lastDate="20th Feb 2025"
                                progress={59}
                                optional={true}
                                image={test}
                            />
                            {/* Add more InProgressCards as needed */}
                        </div>
                        <button className="slider-button right">
                            <ChevronRightIcon />
                        </button>
                    </div>
                </div>

                {/* Available Courses Section */}
                <div className="courses-section">
                    <Typography className="section-title">Available Courses</Typography>
                    <div className="courses-grid">
                        <AvailableCourseCard
                            title="The Complete Python Developer Course Advanced"
                            tutor="Dr. Angela Yu"
                            optional={true}
                            image={test}
                        />
                        {/* Add more AvailableCourseCards as needed */}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Courses;
