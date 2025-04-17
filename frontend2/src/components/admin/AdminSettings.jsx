import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import BranchManagement from './BranchManagement';
import SemesterManagement from './SemesterManagement';
import { useLocation, useNavigate } from 'react-router-dom';

// Helper to get query parameters from URL
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AdminSettings = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const initialTab = query.get('tab') ? parseInt(query.get('tab')) : 0;
  const branchId = query.get('branchId');
  
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update the URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab.toString());
    if (branchId && activeTab === 1) {
      params.set('branchId', branchId);
    }
    
    navigate(`/admin/manage-branch?${params.toString()}`, { replace: true });
  }, [activeTab, branchId, navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'transparent' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Settings
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Manage branches and semesters for student enrollment.
          </Typography>

          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Branch Management" />
            <Tab label="Semester Management" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && <BranchManagement />}
          {activeTab === 1 && <SemesterManagement />}
        </Box>
      </Box>
    </Container>
  );
};

export default AdminSettings; 