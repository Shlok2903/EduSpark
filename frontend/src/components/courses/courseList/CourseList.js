import React, { useState, useEffect } from 'react';
import { Box, Typography, InputAdornment, TextField, CircularProgress, Alert, Button, Dialog, DialogContent, Fab, useTheme, useMediaQuery } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AlertIcon from '../../../assets/alert.svg';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import InProgressCard from '../CourseCard/InProgressCard';
import AvailableCourseCard from '../CourseCard/AvailableCourseCard';
import AddCourse from '../AddCourse';
import Sidebar from '../../common/sidebar/Sidebar';
import './Courses.css';
import { courseService, enrollmentService } from '../../../services/api';
import { handleError } from '../../../utils';
import { useNavigate } from 'react-router-dom';

// Default image for courses that don't have one
const defaultCourseImage = 'https://via.placeholder.com/300x200?text=Course+Image';

function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [openAddCourse, setOpenAddCourse] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    
    // Get user details from localStorage
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const isTutor = localStorage.getItem('isTutor') === 'true';
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const canCreateCourse = isAdmin || isTutor;
    
    useEffect(() => {
        // Set user details from localStorage
        setUserDetails({
            _id: userId,
            isAdmin: isAdmin,
            isTutor: isTutor,
            name: userName
        });
        
        // Fetch courses when component mounts
        fetchCourses();
    }, []);
    
    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError('');
            
            const coursesResponse = await courseService.getAllCourses();
            
            console.log('Courses fetched:', coursesResponse.data); // Add logging for debugging
            
            if (coursesResponse.success) {
                setCourses(coursesResponse.data || []);
                setFilteredCourses(coursesResponse.data || []);
            } else {
                setError(coursesResponse.message || 'Failed to load courses');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            const errorMsg = err.formattedMessage || 'Failed to load courses. Please try again later.';
            setError(errorMsg);
            handleError(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    
    // Filter courses based on search term
    useEffect(() => {
        if (!courses.length) return;

        const filtered = courses.filter(course => 
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.tutor && course.tutor.name && course.tutor.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredCourses(filtered);
    }, [searchTerm, courses]);
    
    // Filter enrolled courses (this would be based on user's enrollment status)
    // For demonstration, we'll just assume no courses are enrolled yet
    const enrolledCourses = [];
    
    const handleOpenAddCourse = () => {
        setOpenAddCourse(true);
    };
    
    const handleCloseAddCourse = () => {
        setOpenAddCourse(false);
        // Refresh courses after adding a new one
        fetchCourses();
    };
    
    // Add scroll handler
    useEffect(() => {
        const mainContent = document.querySelector('.main-content');
        let scrollTimeout;

        const handleScroll = () => {
            mainContent.classList.add('scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                mainContent.classList.remove('scrolling');
            }, 1000); // Hide scrollbar 1 second after scrolling stops
        };

        if (mainContent) {
            mainContent.addEventListener('scroll', handleScroll);
            return () => {
                mainContent.removeEventListener('scroll', handleScroll);
                clearTimeout(scrollTimeout);
            };
        }
    }, []);
    
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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

                {error && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* In Progress Section */}
                        {enrolledCourses.length > 0 && (
                            <div className="courses-section">
                                <div className="section-header">
                                    <Typography className="section-title">In Progress</Typography>
                                    <Typography className="courses-count">{enrolledCourses.length} Courses in progress</Typography>
                                </div>
                                <div className="courses-slider">
                                    <div className="courses-container">
                                        {enrolledCourses.map((course) => (
                                            <InProgressCard
                                                key={course._id || course.course_id}
                                                title={course.title}
                                                tutor={course.createdBy?.name || 'Unknown Instructor'}
                                                lastDate={course.deadline ? new Date(course.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                                                progress={course.progress}
                                                optional={course.isOptional}
                                                image={course.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                                            />
                                        ))}
                                    </div>
                                    {enrolledCourses.length > 1 && (
                                        <button className="slider-button right">
                                            <ChevronRightIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Available Courses Section */}
                        <div className="courses-section">
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography className="section-title">Available Courses</Typography>
                                {canCreateCourse && (
                                    <Button 
                                        variant="contained" 
                                        startIcon={<AddIcon />}
                                        onClick={handleOpenAddCourse}
                                        sx={{
                                            backgroundColor: '#FDC886',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            textTransform: 'none',
                                            fontSize: '16px',
                                            boxShadow: 'none',
                                            color: '#37474F',
                                            '&:hover': {
                                                backgroundColor: '#efb56c',
                                                boxShadow: 'none'
                                            }
                                        }}
                                    >
                                        Create Course
                                    </Button>
                                )}
                            </Box>
                            {filteredCourses.length === 0 ? (
                                <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                                    No courses found. {searchTerm ? 'Try a different search term.' : 'Check back later for new courses!'}
                                </Typography>
                            ) : (
                                <div className="courses-grid">
                                    {filteredCourses.map((course) => (
                                        <AvailableCourseCard
                                            key={course._id || course.course_id}
                                            id={course._id || course.course_id}
                                            title={course.title}
                                            tutor={course.createdBy?.name || 'Unknown Instructor'}
                                            optional={course.isOptional}
                                            image={course.imageUrl || defaultCourseImage}
                                            isAdmin={isAdmin}
                                            isTutor={isTutor}
                                            isCreator={course.createdBy?._id === userId}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
                
                {/* Add Course Dialog */}
                <Dialog
                    open={openAddCourse}
                    onClose={handleCloseAddCourse}
                    fullScreen={fullScreen}
                    maxWidth="lg"
                    fullWidth
                    scroll="paper"
                >
                    <DialogContent sx={{ p: 0 }}>
                        <AddCourse onClose={handleCloseAddCourse} />
                    </DialogContent>
                </Dialog>
                
                {/* Floating Add Button for Mobile */}
                {canCreateCourse && (
                    <Box 
                        sx={{ 
                            position: 'fixed', 
                            bottom: 20, 
                            right: 20, 
                            display: { xs: 'block', md: 'none' }
                        }}
                    >
                        <Fab 
                            color="primary" 
                            aria-label="add course" 
                            onClick={handleOpenAddCourse}
                            sx={{
                                backgroundColor: '#FDC886',
                                color: '#37474F',
                                '&:hover': {
                                    backgroundColor: '#efb56c'
                                }
                            }}
                        >
                            <AddIcon />
                        </Fab>
                    </Box>
                )}
            </div>
        </div>
    );
}

export default Courses;
