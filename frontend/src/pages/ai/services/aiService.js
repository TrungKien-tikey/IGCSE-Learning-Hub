const API_BASE_URL = "/api/ai";

export const getAttemptInsight = async (attemptId) => {
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/insights/attempt/${attemptId}`, {
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) {
            throw new Error("Failed to fetch insight");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching attempt insight:", error);
        return null;
    }
};

export const getResultDetails = async (attemptId) => {
    const token = localStorage.getItem('accessToken');
    try {
        const response = await fetch(`${API_BASE_URL}/result/${attemptId}/details`, {
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) {
            throw new Error("Không thể tải kết quả chấm điểm");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching result details:", error);
        throw error;
    }
};
