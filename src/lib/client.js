import axios from 'axios';

const BASE_URL = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") ? 'http://localhost:3000' : '';

export const login = async (studentId, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, { studentId, password }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Login failed');
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/logout`, {}, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Logout failed');
  }
};

export const getSemesters = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/semesters`, {}, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch semesters');
  }
};

export const getCourseTable = async (semester_id) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/course_table`, { semester_id }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch course table');
  }
};

export const getTermBegin = async (year, semester) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/term_begin`, { year, semester }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch term begin date');
  }
}
