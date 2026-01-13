import { useState, useEffect } from 'react';
import axios from 'axios';

export const useSystemData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:8082/api/ai/statistics/system');
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
