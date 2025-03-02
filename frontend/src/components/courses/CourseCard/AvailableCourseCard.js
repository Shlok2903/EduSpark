import React from 'react';
import { Typography, Button } from '@mui/material';
import './CourseCard.css';

function AvailableCourseCard({ title, tutor, optional, image }) {
    return (
        <div className="course-card">
            <div className="course-image">
                <img src={image} alt={title} />
            </div>
            <div className="course-details">
                <Typography variant="h6" className="course-title">{title}</Typography>
                <Typography variant="body2" className="course-tutor">Tutor: {tutor}</Typography>
                <Button variant="contained" fullWidth sx={{ backgroundColor: '#37474F', color: 'white', borderRadius: '8px' }}>
                    Enroll Now
                </Button>
                <span className="course-tag" style={{ backgroundColor: optional ? '#FDC886' : '#FFB74D' }}>
                    {optional ? 'Optional' : 'Mandatory'}
                </span>
            </div>
        </div>
    );
}

export default AvailableCourseCard; 