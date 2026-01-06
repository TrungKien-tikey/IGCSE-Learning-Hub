import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api/v1', // <--- Bỏ phần http://localhost:8080 đi
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosClient;