export const API_BASE_URL = 'https://coursecard.vercel.app/api/';

export const ROUTES = {
  HOME: '/',
  ADMIN: {
    LOGIN: '/admin/login',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    COURSES: '/admin/courses',
    ASSIGN: '/admin/assign',
  },
  TEACHER: {
    LOGIN: '/teacher/login',
    DASHBOARD: '/teacher/dashboard',
    COURSE: (id) => `/teacher/course/${id}`,
  },
  STUDENT: {
    LOGIN: '/student/login',
    DASHBOARD: '/student/dashboard',
    COURSE: (id) => `/student/course/${id}`,
  },
};
