# Stage 1: Build ứng dụng bằng Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy file pom.xml và tải dependencies (giúp cache layer tốt hơn)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code và thực hiện build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Chạy ứng dụng (Runtime)
FROM amazoncorretto:17-alpine-jdk
LABEL maintainer="igcse-learning-hub"
WORKDIR /app

# Copy file jar từ stage build sang
COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]
