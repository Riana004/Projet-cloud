<<<<<<< HEAD
# Stage 1: Build avec Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
=======
# On utilise l'image Maven complète pour pouvoir compiler à la volée
FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /app

# On copie le pom d'abord pour mettre les dépendances en cache
COPY pom.xml .
RUN mvn dependency:go-offline

# On expose le port
EXPOSE 8080

# On lance Maven en mode "run" au lieu de chercher un JAR statique
CMD ["mvn", "spring-boot:run"]
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
