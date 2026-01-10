"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Thông tin chung
  const [examInfo, setExamInfo] = useState({
    title: "",
    description: "",
    duration: 60,
    maxAttempts: 1,
    isActive: true,
    endTime: "",
  });

  // Xóa <DraftQuestion[]>
  const [questionsList, setQuestionsList] = useState([]);

  // State form soạn thảo
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // State câu hỏi nháp (Xóa <DraftQuestion>)
  const [draftQ, setDraftQ] = useState({
    id: 0, // id = 0 nghĩa là đang tạo mới
    content: "",
    image: null,
    score: 10,
    questionType: "MCQ",
    essayCorrectAnswer: "", // Đáp án tham khảo cho ESSAY
    options: [],
  });

  // --- LOGIC XỬ LÝ ẢNH ---
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Xóa 'as string'
        setDraftQ((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setDraftQ((prev) => ({ ...prev, image: null }));
  };

  // --- CÁC LOGIC FORM ---
  const handleInfoChange = (e) => {
    const { name, value, type } = e.target;
    setExamInfo((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleQuestionTypeChange = (type) => {
    setDraftQ((prev) => ({ ...prev, questionType: type, options: [] }));
  };

  const addDraftOption = () => {
    setDraftQ((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: Date.now(), content: "", isCorrect: false },
      ],
    }));
  };

  const handleOptionChange = (id, field, value) => {
    setDraftQ((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const removeDraftOption = (id) => {
    setDraftQ((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== id),
    }));
  };

  const cancelAddQuestion = () => {
    setIsAddingQuestion(false);
    resetDraftQuestion();
  };

  const resetDraftQuestion = () => {
    setDraftQ({
      id: 0,
      content: "",
      image: null,
      score: 10,
      questionType: "MCQ",
      essayCorrectAnswer: "",
      options: [],
    });
  };

  // --- LOGIC LƯU CÂU HỎI VÀO DANH SÁCH ---
  const saveQuestionToList = () => {
    if (!draftQ.content.trim()) return alert("Nội dung câu hỏi không được để trống");
    if (draftQ.score <= 0) return alert("Điểm phải lớn hơn 0");

    if (draftQ.questionType === "MCQ") {
      if (draftQ.options.length < 2) return alert("Câu trắc nghiệm cần ít nhất 2 lựa chọn");
      const hasCorrect = draftQ.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) return alert("Phải chọn ít nhất 1 đáp án đúng");
      const hasEmptyOption = draftQ.options.some((opt) => !opt.content.trim());
      if (hasEmptyOption) return alert("Nội dung đáp án không được để trống");
    }

    if (draftQ.questionType === "ESSAY") {
      if (!draftQ.essayCorrectAnswer || !draftQ.essayCorrectAnswer.trim()) {
        return alert("Vui lòng nhập đáp án tham khảo cho câu tự luận");
      }
    }

    const questionId = draftQ.id === 0 ? Date.now() : draftQ.id;
    const questionToSave = { ...draftQ, id: questionId };

    const exists = questionsList.some((q) => q.id === questionId);

    if (exists) {
      setQuestionsList((prev) =>
        prev.map((q) => (q.id === questionId ? questionToSave : q))
      );
    } else {
      setQuestionsList((prev) => [...prev, questionToSave]);
    }

    setIsAddingQuestion(false);
    resetDraftQuestion();
  };

  const editQuestionFromList = (q) => {
    setDraftQ(q);
    setIsAddingQuestion(true);
  };

  const removeQuestionFromList = (idToDelete) => {
    setQuestionsList(questionsList.filter((q) => q.id !== idToDelete));
  };

  // --- LOGIC SUBMIT LÊN SERVER ---
  const handleSubmitExam = async () => {
    if (!examInfo.title.trim()) return alert("Vui lòng nhập tên bài thi");
    if (questionsList.length === 0) return alert("Bài thi cần ít nhất 1 câu hỏi");

    setLoading(true);

    const payload = {
      ...examInfo,
      endTime: examInfo.endTime ? examInfo.endTime : null,
      questions: questionsList.map((q, index) => {
        const { id, ...restQuestion } = q;
        const formattedOptions =
          q.questionType === "MCQ"
            ? q.options.map(({ id, ...restOption }) => restOption)
            : [];

        return {
          ...restQuestion,
          image: q.image || "",
          orderIndex: index,
          options: formattedOptions,
        };
      }),
    };

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Lỗi khi lưu bài thi");

      alert("Tạo bài thi thành công!");
      navigate("/exams/manage");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tạo bài thi mới</h1>
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:underline">
          ← Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CỘT TRÁI: THÔNG TIN CHUNG */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow h-fit sticky top-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Thông tin chung</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên bài thi *</label>
              <input
                type="text"
                name="title"
                value={examInfo.title}
                onChange={handleInfoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="VD: Kiểm tra Toán giữa kỳ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                name="description"
                value={examInfo.description}
                onChange={handleInfoChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Thời gian (phút) *</label>
              <input
                type="number"
                name="duration"
                min="1"
                value={examInfo.duration}
                onChange={handleInfoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày giờ hết hạn</label>
              <input
                type="datetime-local"
                name="endTime"
                value={examInfo.endTime}
                onChange={handleInfoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lần làm tối đa</label>
              <input
                type="number"
                name="maxAttempts"
                min="1"
                value={examInfo.maxAttempts}
                onChange={handleInfoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="flex items-center pt-2">
              <input
                id="isActive"
                type="checkbox"
                checked={examInfo.isActive}
                onChange={(e) => setExamInfo((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Kích hoạt bài thi ngay
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: QUẢN LÝ CÂU HỎI */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Danh sách câu hỏi ({questionsList.length})
              </h2>
              {!isAddingQuestion && (
                <button
                  onClick={() => setIsAddingQuestion(true)}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium text-sm flex items-center"
                >
                  + Thêm câu hỏi
                </button>
              )}
            </div>

            {questionsList.length === 0 ? (
              <p className="text-gray-500 text-center italic py-4 border-2 border-dashed rounded">
                Chưa có câu hỏi nào.
              </p>
            ) : (
              <ul className="space-y-3">
                {questionsList.map((q, index) => (
                  <li key={q.id} className="border p-3 rounded flex justify-between items-start bg-gray-50">
                    <div className="flex gap-3">
                      {q.image && (
                        <img src={q.image} alt="Question" className="w-16 h-16 object-cover rounded border" />
                      )}
                      <div>
                        <span className="font-bold mr-2">Câu {index + 1}.</span>
                        <span className="text-gray-800 line-clamp-2">{q.content}</span>
                        <div className="text-sm text-gray-500 mt-1 flex gap-2">
                          <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                            {q.questionType === "MCQ" ? "Trắc nghiệm" : "Tự luận"}
                          </span>
                          <span>• {q.score} điểm</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editQuestionFromList(q)} className="text-blue-500 hover:text-blue-700 text-sm px-2 font-medium">
                        Sửa
                      </button>
                      <button onClick={() => removeQuestionFromList(q.id)} className="text-red-500 hover:text-red-700 text-sm px-2">
                        Xóa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAddingQuestion && (
            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg shadow-md animate-fade-in">
              <h3 className="text-lg font-bold text-blue-800 mb-4">
                {draftQ.id === 0 ? "Soạn câu hỏi mới" : "Chỉnh sửa câu hỏi"}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung câu hỏi *</label>
                <textarea
                  value={draftQ.content}
                  onChange={(e) => setDraftQ({ ...draftQ, content: e.target.value })}
                  rows={2}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Nhập nội dung câu hỏi..."
                ></textarea>
              </div>

              {/* UPLOAD ẢNH */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh minh họa (Tùy chọn)</label>
                {!draftQ.image ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  />
                ) : (
                  <div className="relative inline-block mt-2">
                    <img src={draftQ.image} alt="Preview" className="h-40 w-auto object-contain rounded border border-gray-300 bg-white" />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600"
                      title="Xóa ảnh"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm số</label>
                  <input
                    type="number"
                    min="1"
                    value={draftQ.score}
                    onChange={(e) => setDraftQ({ ...draftQ, score: parseInt(e.target.value) || 0 })}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
                  <select
                    value={draftQ.questionType}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                    className="w-full border p-2 rounded"
                  >
                    <option value="MCQ">Trắc nghiệm (MCQ)</option>
                    <option value="ESSAY">Tự luận (Essay)</option>
                  </select>
                </div>
              </div>

              {/* ESSAY REFERENCE ANSWER */}
              {draftQ.questionType === "ESSAY" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đáp án tham khảo (Reference Answer) *
                  </label>
                  <textarea
                    value={draftQ.essayCorrectAnswer || ''}
                    onChange={(e) => setDraftQ({ ...draftQ, essayCorrectAnswer: e.target.value })}
                    rows={4}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    placeholder="Nhập đáp án mẫu để AI tham khảo khi chấm điểm..."
                  />
                  <small className="text-gray-500 text-xs mt-1 block">
                    💡 Đáp án này sẽ được AI sử dụng làm tiêu chí chấm điểm. Hãy nhập đáp án chi tiết và chính xác.
                  </small>
                </div>
              )}

              {draftQ.questionType === "MCQ" && (
                <div className="mb-4 bg-white p-4 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Các lựa chọn đáp án *</label>
                    <button type="button" onClick={addDraftOption} className="text-sm text-blue-600 hover:underline">
                      + Thêm lựa chọn
                    </button>
                  </div>
                  <div className="space-y-2">
                    {draftQ.options.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={(e) => handleOptionChange(opt.id, "isCorrect", e.target.checked)}
                          className="h-5 w-5 text-green-600 accent-green-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt.content}
                          onChange={(e) => handleOptionChange(opt.id, "content", e.target.value)}
                          placeholder={`Lựa chọn ${idx + 1}`}
                          className={`flex-1 border p-2 rounded ${opt.isCorrect ? "border-green-500 bg-green-50" : ""}`}
                        />
                        <button onClick={() => removeDraftOption(opt.id)} className="text-red-400 hover:text-red-600 px-2 font-bold">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={cancelAddQuestion} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">
                  Hủy
                </button>
                <button onClick={saveQuestionToList} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
                  {draftQ.id === 0 ? "Lưu câu hỏi này" : "Cập nhật câu hỏi"}
                </button>
              </div>
            </div>
          )}

          {questionsList.length > 0 && !isAddingQuestion && (
            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleSubmitExam}
                disabled={loading}
                className={`w-full py-4 rounded-lg text-white text-xl font-bold transition shadow-lg ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-xl"
                  }`}
              >
                {loading ? "Đang lưu..." : "✓ HOÀN TẤT VÀ TẠO BÀI THI"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
