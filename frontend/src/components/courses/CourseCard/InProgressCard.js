import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import './CourseCard.css';

function InProgressCard({ title, tutor, lastDate, progress, optional, image }) {
    return (
        <div className="course-card">
            <div className="course-image">
                <img src={image} alt={title} />
                <div className="last-date">
                    <Typography variant="body2" style={{ color: '#E9967A' }}>Last Date</Typography>
                    <Typography variant="body2" style={{ color: 'white' }}>{lastDate}</Typography>
                </div>
            </div>
            <div className="course-details">
                <Typography  className="course-title">{title}</Typography>
                <Typography variant="body2" className="course-tutor">Tutor: {tutor}</Typography>
                <Typography  className="progress-text">{progress}% Completed</Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: '10px', height: '16px', backgroundColor: '#DADADA', '& .MuiLinearProgress-bar': { backgroundColor: '#455A64' } }} />
                <span className="course-tag" style={{ backgroundColor: optional ? '#FDC886' : '#FFB74D' }}>
                    {optional ? 'Optional' : 'Mandatory'}
                </span>
            </div>
        </div>
    );
}

export default InProgressCard; 