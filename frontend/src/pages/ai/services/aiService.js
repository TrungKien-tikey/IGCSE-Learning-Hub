const API_BASE_URL = "/api/ai";

/**
 * Validate ID parameter
 * @param {any} id - ID to validate
 * @param {string} paramName - Name of parameter for error message
 * @throws {Error} If ID is invalid
 */
function validateId(id, paramName = "ID") {
    if (!id || id === "undefined" || id === "null" || String(id).trim() === "") {
        throw new Error(`${paramName} không được để trống`);
    }
    if (isNaN(id) || Number(id) <= 0) {
        throw new Error(`${paramName} phải là số hợp lệ`);
    }
}

export const getAttemptInsight = async (attemptId) => {
    validateId(attemptId, "Attempt ID");
    
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
    validateId(attemptId, "Attempt ID");
    
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
