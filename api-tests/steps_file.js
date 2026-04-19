const { actor } = require('codeceptjs');

module.exports = function() {
  return actor({

    // Định nghĩa hàm login dùng chung
    loginAsTeacher: async function(email, password) {
      // 1. Gửi request POST đến API đăng nhập qua Kong (cổng 8000)
      const response = await this.sendPostRequest('/auth/login', {
        email: email,
        password: password
      });

      // 2. Kiểm tra xem đăng nhập có thành công không
      this.seeResponseCodeIs(200);

      // 3. Trích xuất token từ JSON trả về (dựa theo class AuthResponse của bạn)
      const token = response.data.token;

      // 4. Tự động gắn Token này vào Header (Bearer) cho MỌI request phía sau
      this.amBearerAuthenticated(token);
    },

    // Hàm phụ trợ để xóa Token (dùng khi test lỗi 401)
    clearAuth: function() {
      this.amBearerAuthenticated('');
    }

  });
}