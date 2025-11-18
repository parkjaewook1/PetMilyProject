FROM openjdk:21
COPY build/libs/backend-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "--enable-preview", "-jar", "app.jar"]