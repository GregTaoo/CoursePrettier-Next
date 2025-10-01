import axios from 'axios';

const BASE_URL = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") ? 'http://localhost:3000' : '';

export const login = async (studentId: string, password: string) => {
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

export const getCourseTable = async (semester_id: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/course_table`, { semester_id }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch course table');
  }
};

export const getTermBegin = async (year: string | number, semester: string | number) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/term_begin`, { year, semester }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch term begin date');
  }
}

export const getCourseBench = async () => {
  try {
    const response = await axios.get('https://coursebench.org/v1/course/all');
    return response.data;
  } catch (error) {
    throw new Error('Failed to get courses from CourseBench');
  }
}
