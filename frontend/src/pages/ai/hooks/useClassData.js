import { useState, useEffect } from 'react';
import axios from 'axios';

export const useClassData = (classId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!classId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:8082/api/ai/statistics/class/${classId}`);
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching class statistics:", err);
                setError("Không thể tải dữ liệu thống kê lớp học.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Cài đặt polling nếu cần (ví dụ 30s một lần)
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [classId]);

    return { data, loading, error };
};
