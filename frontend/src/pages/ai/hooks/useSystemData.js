import { useState, useEffect } from 'react';
import axios from 'axios';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL;

export const useSystemData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(`${AI_SERVICE_URL}/statistics/system`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': '69420',
                        ...(token ? { "Authorization": `Bearer ${token}` } : {})
                    }
                });
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching system statistics:", err);
                setError("Không thể tải dữ liệu thống kê hệ thống.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 300000); // 5 minutes polling
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error };
};
