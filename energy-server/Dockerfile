# STAGE 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# STAGE 2: Run the application
FROM eclipse-temurin:21-jre 
WORKDIR /app
RUN apt-get update && apt-get install -y curl libgomp1 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/*.jar app.jar
COPY dataset ./dataset
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]