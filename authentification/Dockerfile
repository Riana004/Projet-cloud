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