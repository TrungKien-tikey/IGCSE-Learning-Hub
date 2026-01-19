# Sử dụng Amazon Corretto 17 (Rất ổn định và nhẹ)
FROM amazoncorretto:17-alpine-jdk

# Thêm thông tin tác giả (Tùy chọn)
LABEL maintainer="igcse-learning-hub"

# Copy file jar được build từ maven vào container
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Chạy ứng dụng
ENTRYPOINT ["java","-jar","/app.jar"]