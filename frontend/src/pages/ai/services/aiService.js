const API_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8082/api/ai";

export const getAttemptInsight = async (attemptId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/insights/attempt/${attemptId}`);
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
    try {
        const response = await fetch(`${API_BASE_URL}/result/${attemptId}/details`);
        if (!response.ok) {
            throw new Error("Không thể tải kết quả chấm điểm");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching result details:", error);
        throw error;
    }
};
