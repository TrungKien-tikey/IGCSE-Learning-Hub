"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from '../../layouts/MainLayout';

export default function EditExamPage() {
  const navigate = useNavigate();
  const params = useParams();
  const examId = params.id;

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

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

  // Xóa <DraftQuestion>
  const [draftQ, setDraftQ] = useState({
    id: 0,
    content: "",
    image: null,
    score: 10,
    questionType: "MCQ",
    options: [],
  });

  // --- 1. LOAD DỮ LIỆU CŨ TỪ SERVER ---
  useEffect(() => {
    if (!examId) return;

    fetch(`/api/exams/${examId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy bài thi");
        return res.json();
      })
      .then((data) => {
        setExamInfo({
          title: data.title,
          description: data.description || "",
          duration: data.duration,
          maxAttempts: data.maxAttempts || 1,
          isActive: data.isActive,
          endTime: data.endTime || "",
        });

        // Xóa : any
        const mappedQuestions = data.questions.map((q) => ({
          id: q.questionId,
          content: q.content,
          image: q.image,
          score: q.score,
          questionType: q.questionType,
          options: q.options.map((opt) => ({
            id: opt.optionId,
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        }));

        setQuestionsList(mappedQuestions);
        setDataLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Lỗi tải bài thi!");
        navigate("/exams/manage");
      });
  }, [examId]);

  // --- LOGIC FORM ---
  // Xóa : React.ChangeEvent...
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Ảnh quá lớn (<2MB)");
      const reader = new FileReader();
      reader.onloadend = () =>
        setDraftQ((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => setDraftQ((prev) => ({ ...prev, image: null }));

  const handleInfoChange = (e) => {
    const { name, value, type } = e.target;
    setExamInfo((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleQuestionTypeChange = (type) =>
    setDraftQ((prev) => ({ ...prev, questionType: type, options: [] }));

  const addDraftOption = () =>
    setDraftQ((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: Date.now(), content: "", isCorrect: false },
      ],
    }));

  const handleOptionChange = (id, field, value) => {
    setDraftQ((prev) => {
      // Nếu đang đánh dấu đáp án là ĐÚNG (isCorrect = true)
      // Thì phải RESET tất cả các đáp án khác về false
      if (field === "isCorrect" && value === true) {
        return {
          ...prev,
          options: prev.options.map((opt) => ({
            ...opt,
            isCorrect: opt.id === id, // Chỉ đáp án đang chọn là true, còn lại là false
          })),
        };
      }

      // Các trường hợp khác (sửa nội dung text hoặc bỏ chọn) thì giữ nguyên
      return {
        ...prev,
        options: prev.options.map((opt) =>
          opt.id === id ? { ...opt, [field]: value } : opt
        ),
      };
    });
  };

  const removeDraftOption = (id) =>
    setDraftQ((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== id),
    }));

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
      options: [],
    });
  };

  // Logic lưu câu hỏi (Thêm mới hoặc Cập nhật)
  const saveQuestionToList = () => {
    if (!draftQ.content.trim()) return alert("Nhập nội dung câu hỏi");
    if (draftQ.questionType === "MCQ" && draftQ.options.length < 2)
      return alert("Cần ít nhất 2 đáp án");
    if (draftQ.questionType === "MCQ" && !draftQ.options.some((o) => o.isCorrect))
      return alert("Chọn ít nhất 1 đáp án đúng");

    // Nếu id=0 -> Là tạo mới (dùng Date.now). Nếu id khác 0 -> Là sửa (giữ nguyên ID thật)
    const questionId = draftQ.id === 0 ? Date.now() : draftQ.id;
    const questionToSave = { ...draftQ, id: questionId };

    const exists = questionsList.some((q) => q.id === questionId);

    if (exists) {
      // Cập nhật
      setQuestionsList(prev => prev.map(q => q.id === questionId ? questionToSave : q));
    } else {
      // Thêm mới
      setQuestionsList(prev => [...prev, questionToSave]);
    }

    setIsAddingQuestion(false);
    resetDraftQuestion();
  };

  const removeQuestionFromList = (id) =>
    setQuestionsList(questionsList.filter((q) => q.id !== id));

  const editQuestionFromList = (q) => {
    setDraftQ(q);
    setIsAddingQuestion(true);
  };

  const handleUpdateExam = async () => {
    if (!examInfo.title.trim()) return alert("Vui lòng nhập tên bài thi");
    if (questionsList.length === 0) return alert("Cần ít nhất 1 câu hỏi");

    setLoading(true);

    const payload = {
      ...examInfo,
      endTime: examInfo.endTime ? examInfo.endTime : null,
      questions: questionsList.map((q, index) => {
        const { id, ...rest } = q;
        const formattedOptions =
          q.questionType === "MCQ"
            ? q.options.map(({ id, ...optRest }) => optRest)
            : [];

        return {
          ...rest,
          image: q.image || "",
          orderIndex: index,
          options: formattedOptions,
        };
      }),
    };

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Lỗi khi cập nhật");
      alert("Cập nhật bài thi thành công!");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading)
    return (
      <MainLayout>
        <div className="text-center p-10">Đang tải dữ liệu bài thi...</div>
      </MainLayout>
    )

  return (
    <MainLayout>
      <div className="">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Sửa bài thi: {examInfo.title}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:underline"
          >
            ← Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CỘT TRÁI: THÔNG TIN CHUNG */}
          <div className="md:col-span-1 bg-white p-6 rounded-lg shadow h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin chung</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Tên bài thi</label>
                <input
                  type="text"
                  name="title"
                  value={examInfo.title}
                  onChange={handleInfoChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mô tả</label>
                <textarea
                  name="description"
                  value={examInfo.description}
                  onChange={handleInfoChange}
                  rows={3}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={examInfo.duration}
                  onChange={handleInfoChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Ngày hết hạn</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={examInfo.endTime}
                  onChange={handleInfoChange}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>

              {/* --- MỚI: SỐ LẦN LÀM BÀI --- */}
              <div>
                <label className="block text-sm font-medium">Số lần làm tối đa</label>
                <input
                  type="number"
                  name="maxAttempts"
                  min="1"
                  value={examInfo.maxAttempts}
                  onChange={handleInfoChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  checked={examInfo.isActive}
                  onChange={(e) =>
                    setExamInfo((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <label className="ml-2">Kích hoạt bài thi</label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: QUẢN LÝ CÂU HỎI */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Danh sách câu hỏi ({questionsList.length})
                </h2>
                {!isAddingQuestion && (
                  <button
                    onClick={() => setIsAddingQuestion(true)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                  >
                    + Thêm câu hỏi
                  </button>
                )}
              </div>

              <ul className="space-y-3">
                {questionsList.map((q, index) => (
                  <li
                    key={q.id}
                    className="border p-3 rounded flex justify-between items-start bg-gray-50"
                  >
                    <div className="flex gap-3">
                      {q.image && (
                        <img
                          src={q.image}
                          alt="Question"
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
                      <div>
                        <span className="font-bold mr-2">Câu {index + 1}.</span>{" "}
                        {q.content}
                      </div>
                    </div>
                    <div className="flex gap-2 min-w-fit">
                      <button
                        onClick={() => editQuestionFromList(q)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => removeQuestionFromList(q.id)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* FORM SOẠN THẢO */}
            {isAddingQuestion && (
              <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-blue-800 mb-4">
                  {draftQ.id === 0 ? "Thêm mới" : "Sửa câu hỏi"}
                </h3>

                {/* NỘI DUNG CÂU HỎI */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Nội dung câu hỏi *
                  </label>
                  <textarea
                    value={draftQ.content}
                    onChange={(e) =>
                      setDraftQ({ ...draftQ, content: e.target.value })
                    }
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
                    placeholder="Nhập nội dung..."
                    rows={2}
                  ></textarea>
                </div>

                {/* UPLOAD ẢNH */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Hình ảnh (Tùy chọn)
                  </label>
                  {!draftQ.image ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                    />
                  ) : (
                    <div className="relative inline-block mt-2">
                      <img
                        src={draftQ.image}
                        alt="Preview"
                        className="h-40 w-auto object-contain rounded border bg-white"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* ĐIỂM & LOẠI CÂU HỎI */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Điểm số
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={draftQ.score}
                      onChange={(e) =>
                        setDraftQ({
                          ...draftQ,
                          score: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Loại câu hỏi
                    </label>
                    <select
                      value={draftQ.questionType}
                      onChange={(e) =>
                        handleQuestionTypeChange(
                          e.target.value
                        )
                      }
                      className="w-full border p-2 rounded"
                    >
                      <option value="MCQ">Trắc nghiệm (MCQ)</option>
                      <option value="ESSAY">Tự luận (Essay)</option>
                    </select>
                  </div>
                </div>

                {/* PHẦN OPTIONS */}
                {draftQ.questionType === "MCQ" && (
                  <div className="mb-4 bg-white p-4 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Các lựa chọn đáp án *
                      </label>
                      <button
                        type="button"
                        onClick={addDraftOption}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        + Thêm lựa chọn
                      </button>
                    </div>
                    <div className="space-y-2">
                      {draftQ.options.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) =>
                              handleOptionChange(
                                opt.id,
                                "isCorrect",
                                e.target.checked
                              )
                            }
                            className="h-5 w-5 text-green-600 accent-green-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={opt.content}
                            onChange={(e) =>
                              handleOptionChange(
                                opt.id,
                                "content",
                                e.target.value
                              )
                            }
                            placeholder={`Lựa chọn ${idx + 1}`}
                            className={`flex-1 border p-2 rounded ${opt.isCorrect ? "border-green-500 bg-green-50" : ""
                              }`}
                          />
                          <button
                            onClick={() => removeDraftOption(opt.id)}
                            className="text-red-400 hover:text-red-600 px-2 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={cancelAddQuestion}
                    className="px-4 py-2 text-gray-600 bg-white border rounded"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={saveQuestionToList}
                    className="px-6 py-2 bg-blue-600 text-white rounded"
                  >
                    {draftQ.id === 0 ? "Lưu câu hỏi mới" : "Cập nhật câu hỏi"}
                  </button>
                </div>
              </div>
            )}

            {/* BUTTON UPDATE */}
            {!isAddingQuestion && questionsList.length > 0 && (
              <button
                onClick={handleUpdateExam}
                disabled={loading}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white text-xl font-bold rounded-lg shadow-lg"
              >
                {loading ? "Đang cập nhật..." : "LƯU THAY ĐỔI"}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
