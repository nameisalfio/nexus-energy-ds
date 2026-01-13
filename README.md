# ⚡ Distributed Energy Consumption Monitor

A distributed software system designed to monitor, analyze, and predict building energy consumption using AI.  
This project implements a **Multi-Tier Architecture** separating the Presentation Layer (React SPA) from the Business Logic/Data Layer (Spring Boot), demonstrating key distributed systems patterns like **Remote Facade**, **BFF (Backend for Frontend)**, and **DTOs**.

---

## 🏛️ System Architecture

The system is orchestrated via **Docker Compose** and consists of two main microservices and a persistent data layer.

![Architecture Diagram](assets/architecture_diagram.png)

### 1. Client Service (Frontend - Port 5173 / 80)
- **Technology:** React (TypeScript) + Vite + Nginx  
- **Role:** Presentation Layer (Single Page Application).  
- **Responsibility:**
    - Provides a responsive dashboard for real-time monitoring.
    - Communicates with the backend via REST API.
    - Visualizes complex data (Charts, Data Tables, AI Insights).
    - Handles user interactions (CSV Upload, Data Filtering).

### 2. Server Service (Backend - Port 8081)
- **Technology:** Java 21 + Spring Boot 3  
- **Role:** Business Logic, AI Engine & Data Persistence.  
- **Pattern:** Exposes a **Coarse-Grained Remote Facade** to minimize network chattiness.  
- **Responsibility:**
    - Manages the MySQL Database via Spring Data JPA.
    - **AI Engine:** Loads a pre-trained LSTM Neural Network (Deeplearning4j) for anomaly detection.
    - **Digital Twin Logic:** Compares real-time data vs AI predictions to flag anomalies.
    - Processes batch CSV ingestion transactions.

### 3. Data Layer
- **MySQL 8.0:** Persistent storage for historical energy readings.
- **File System:** Stores the trained AI model (`trained_model.zip`) and normalizers.

---

## 🛠️ Tech Stack

| Component      | Technology                     |
| :------------- | :----------------------------- |
| **Frontend**   | React, TypeScript, Vite, CSS Grid |
| **Backend**    | Java 21, Spring Boot 3 (Web, JPA) |
| **AI / ML**    | Deeplearning4j (DL4J), ND4J (Native) |
| **Database**   | MySQL 8.0 (Dockerized)         |
| **DevOps**     | Docker, Docker Compose         |
| **Patterns**   | Remote Facade, DTO, Repository, Singleton |

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose (Required)
- Java 21 (Optional, for local dev)
- Node.js 18+ (Optional, for local dev)

### 1. Environment Variables

The system uses a `.env` file to configure environment-specific variables. Create a `.env` file in the root directory with the following structure:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=energy_db
MYSQL_USER=
MYSQL_PASSWORD=
```

Ensure the `.env` file is not committed to version control by adding it to `.gitignore`.

### 2. Build & Run (Docker Method - Recommended)

This command builds the React frontend, compiles the Java backend, and starts the MySQL database.

```bash
docker-compose up --build
```

- **Frontend:** Accessible at `http://localhost:5173` (or port 80 based on config)  
- **Backend:** Accessible at `http://localhost:8081/api`

---

### 3. Manual Training 

The system comes with a pre-trained model. If you want to retrain the AI model from scratch:

```bash
cd energy-server
# Ensure Energy_consumption.csv is in the dataset folder
mvn compile exec:java -Dexec.mainClass="com.energy.energy_server.ai.Train"
```

This generates new `trained_model.zip` and `normalizer.bin` files in the `data/` directory.

---

## 📊 Features & Usage

### 1. CSV Batch Ingestion (ETL)
- Click "📂 Upload CSV" on the top right.
- Select the provided `Energy_consumption.csv`.
- The system parses thousands of records and performs a Batch Insert into MySQL.

### 2. AI Digital Twin (Anomaly Detection)
- The dashboard features a dedicated "AI Digital Twin Analysis" panel.
- **Logic:** The AI (LSTM) looks at the past 24 hours of data and predicts what the current consumption should be.
- **Anomaly Flag:** If the actual value deviates by more than 20% from the AI prediction, the system flags it as an **ANOMALY** (Red Indicator). Otherwise, it's **NORMAL** (Green Indicator).

### 3. Weekly Analysis
- Aggregated view showing average consumption trends grouped by day of the week (Monday - Sunday).

### 4. Live Data Log
- Real-time table showing the latest 100 records with visual status indicators for HVAC and Lighting systems.

---

## 🔌 API Reference (Remote Facade)

The Backend exposes a Coarse-Grained API to optimize frontend performance:

| Method | Endpoint              | Description                                      | Pattern          |
| :----- | :-------------------- | :----------------------------------------------- | :--------------- |
| GET    | `/api/full-report`    | Returns aggregated stats, recent logs, and AI insights in a single call. | Remote Facade    |
| POST   | `/api/ingest-dataset` | Handles multipart file upload for batch processing. | Batch Processing |
| GET    | `/api/stats/weekly`   | Returns pre-calculated weekly averages.          | Aggregation      |

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.






Apri Kibana: http://localhost:5601.
Vai su Management (icona ingranaggio) -> Stack Management.
Clicca su Data Views -> Create data view.
Nel campo Name, inserisci il pattern che hai definito in Logstash: energy-server-logs-*.
Dovresti vedere che Kibana trova l'indice (es. energy-server-logs-2024.01.03).
Nel campo Timestamp field, seleziona @timestamp.
Salva.
Ora vai nel menu Analytics -> Discover e vedrai i tuoi log.






Apri Kibana -> Dashboard -> Create New.
Grafico 1: Timeline Anomalie (Bar Chart)
Asse X: @timestamp
Asse Y: Count
Filtro: event_type: "ANOMALY"
Cosa vedi: Quante anomalie ci sono state ogni ora.
Grafico 2: Deviazione Media (Metric)
Metric: Average di anomaly_deviation.
Cosa vedi: Quanto sono gravi le anomalie in media (es. "35%").
Grafico 3: Previsto vs Reale (Line Chart - Lens)
Asse X: @timestamp
Asse Y (Layer 1): anomaly_actual (Colore Rosso)
Asse Y (Layer 2): anomaly_predicted (Colore Blu)
Cosa vedi: Un confronto visivo di quanto il modello AI si è sbagliato nei momenti critici.