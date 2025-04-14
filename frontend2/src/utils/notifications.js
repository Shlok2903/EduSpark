import { toast } from 'react-toastify';

// Function to handle and display errors
export const handleError = (message) => {
  toast.error(message || 'An error occurred', {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Function to handle and display success messages
export const handleSuccess = (message) => {
  toast.success(message || 'Success!', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Function to handle and display information messages
export const handleInfo = (message) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
}; 