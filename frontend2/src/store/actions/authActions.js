import { LOGOUT } from '../types/authTypes';

export const logout = () => (dispatch) => {
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Dispatch logout action
  dispatch({
    type: LOGOUT
  });
}; 