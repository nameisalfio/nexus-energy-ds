# Nexus Energy Distributed Service

Nexus Energy Distributed Service is a full‑stack, distributed platform designed for high‑fidelity monitoring, predictive analytics, and intelligent visualization of building energy consumption. The system combines modern frontend engineering, a scalable multi‑tier backend, deep learning–driven inference, and enterprise‑grade observability into a cohesive ecosystem.

The primary objective of this project is to demonstrate how heterogeneous technologies can be integrated into a single production‑ready architecture capable of ingesting telemetry, running real‑time AI predictions, and delivering actionable insights through a modern user interface.

This repository showcases not only a working distributed system, but also the full research and engineering lifecycle: dataset exploration, feature engineering, model training, API design, system orchestration, and user‑centric visualization.

The dataset used for reproducibility and model research can be accessed via the following link:

[![Access Dataset](https://img.shields.io/badge/Dataset-Access-blue?style=for-the-badge)](https://www.kaggle.com/datasets/mrsimple07/energy-consumption-prediction)


---

## Conceptual Vision

The platform is built around the concept of a **Digital Energy Twin**: a neural model continuously learns from telemetry streams and produces a predicted energy consumption value. By comparing predicted versus actual consumption, the system identifies inefficiencies, behavioral anomalies, and potential optimization opportunities.

This approach mirrors real industrial energy‑management systems used in smart buildings and Industry 4.0 environments, where predictive intelligence is used to reduce costs and improve sustainability.


---

## System Architecture

The project follows a distributed, multi‑tier architecture orchestrated via Docker Compose. Each layer is isolated by responsibility to ensure scalability, maintainability, and technology independence.

### High‑Level Architecture Layers

1. Presentation Layer (energy-client)
2. Service & AI Layer (energy-server)
3. Data & Observability Layer (MySQL + ELK Stack)

Each component is containerized, enabling reproducible deployment across environments. Below is the high-level architecture diagram illustrating the system's components and their interactions:

<p align="center">
    <img src="assets/architecture_diagram.jpeg" alt="System Architecture" width="450">
</p>

---

## 1. Presentation Layer – energy-client

### Technology Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide Icons

### Architectural Pattern
The frontend implements the **Backend for Frontend (BFF)** consumption model, relying on aggregated endpoints rather than multiple fine‑grained API calls. This reduces latency and simplifies state synchronization.

### Core Capabilities

#### Dynamic Data Explorer
A multi‑level nested filtering engine allows users to explore telemetry by:
- Temporal dimensions (day, hour, seasonality)
- Environmental parameters (humidity, HVAC activity)
- Numerical thresholds (energy usage ranges)

This enables deep analytical drill‑down without requiring external BI tools.

#### Real‑Time Telemetry Visualization
The UI renders Server‑Sent Events (SSE) streams in real time, plotting:
- Actual consumption
- AI‑predicted consumption
- Delta deviation between the two

This provides immediate feedback on system behavior and model performance.

#### State Persistence & UX Engineering
Advanced UI continuity features preserve user context during data updates:
- Scroll position locking via `useRef`
- Non‑blocking state transitions
- Smooth re‑rendering strategies

The result is a responsive interface capable of handling continuous data streams without degrading usability.


---

## 2. Service Layer – energy-server

### Technology Stack
- Java 21
- Spring Boot 3
- Deeplearning4j (DL4J)

### Architectural Patterns

#### Remote Facade Pattern
The backend exposes coarse‑grained endpoints such as `/api/full-report` to minimize network chatter and aggregate multiple internal computations into a single response payload.

#### Command & Observer Patterns
- Simulation control endpoints act as command triggers
- SSE endpoints implement the observer model for live data streaming

### AI Inference Engine

The system integrates a Long Short‑Term Memory (LSTM) neural network implemented in DL4J.

#### Digital Twin Simulation
The AI engine continuously:
- Receives telemetry
- Produces predicted consumption values
- Compares prediction vs reality
- Flags efficiency deviations

This design demonstrates real‑time inference in a production‑like environment rather than offline batch prediction.


---

## 3. Data & Observability Layer

### MySQL 8.0
MySQL acts as the persistent telemetry and configuration store, supporting:
- Historical consumption logs
- User data
- System state metadata

### ELK Stack

#### Logstash
Transforms and normalizes logs from all services into structured events.

#### Elasticsearch
Indexes telemetry and logs for fast querying, time‑series search, and aggregation.

#### Kibana
Provides observability dashboards, including:
- Anomaly heatmaps
- Model confidence visualization
- System health monitoring

This observability layer brings the project to enterprise‑grade standards by making every subsystem transparent and measurable.


---

## Data Science & Model Development Workflow

A major pillar of this project is the rigorous analytical work conducted before the AI engine was implemented.

### Dataset Analysis Notebook

Location:
`energy-server/dataset/python_viz/analysis.py`

This notebook represents a full scientific workflow including:

#### Exploratory Data Analysis (EDA)
- Identification of seasonal patterns
- Correlation between occupancy and energy consumption
- Distribution profiling of environmental variables

#### Feature Engineering
- Cyclical time encoding (sine/cosine transformations)
- Normalization strategies for stable neural convergence
- Temporal windowing for LSTM input sequences

#### Visualization & Statistical Validation
- Correlation matrices
- Distribution plots
- Trend decomposition

The findings of this notebook directly informed:
- Neural network architecture design
- Feature selection
- Backend inference pipeline behavior

The project therefore maintains **full reproducibility** between research and production.


---

## API Surface

### Authentication & Identity Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/register | Registers a new user with default USER role | Public |
| POST | /api/login | Returns JWT and user profile | Public |
| POST | /api/logout | Invalidates JWT via blacklist | Authenticated |
| GET | /api/users | Lists all operators | Admin |
| POST | /api/users/change-role | Updates user roles | Admin |
| DELETE | /api/users/{id} | Deletes an operator account | Admin |

### Telemetry & Simulation Control

| Method | Endpoint | Description | Pattern |
|--------|----------|-------------|--------|
| POST | /api/simulation/start | Starts telemetry & inference | Command |
| POST | /api/simulation/stop | Stops simulation | Command |
| GET | /api/stream | SSE live telemetry feed | Observer |
| GET | /api/health | System health check | Diagnostic |

### Aggregated Analytics

| Method | Endpoint | Description | Pattern |
|--------|----------|-------------|--------|
| GET | /api/full-report | Unified system report | Remote Facade |
| GET | /api/stats/weekly | Weekly trends | Aggregator |
| POST | /api/ingest-dataset | CSV batch import | Bulk Import |
| DELETE | /api/data/clear | Clears telemetry | Cleanup |


---

## DevOps & Deployment

### Container Orchestration

The entire ecosystem is deployed using Docker Compose, including:
- Frontend
- Backend
- MySQL
- Elasticsearch
- Logstash
- Kibana

### Installation Steps

#### Clone Repository
```
git clone git@github.com:nameisalfio/energy-distributed-service.git
cd energy-distributed-service
```

#### Environment Configuration
Create a `.env` file at the project root containing database credentials and system secrets. Refer to the provided template.

#### Launch Full Stack
```
docker-compose up --build
```

### AI Model Retraining

To retrain the LSTM model with updated data:
```
cd energy-server
mvn compile exec:java -Dexec.mainClass="com.energy.energy_server.ai.Train"
```


---

## Technical Summary

| Component | Technology | Role |
|----------|------------|------|
| Frontend | React, Tailwind CSS | Visualization & UX |
| Backend | Spring Boot, DL4J | Business logic & AI inference |
| Database | MySQL 8.0 | Persistent storage |
| Observability | ELK Stack | Monitoring & analytics |
| DevOps | Docker | Orchestration |


---

## Project Value Proposition

This project demonstrates:

- A real distributed micro‑ecosystem rather than a monolithic demo
- Production‑style AI inference integration in Java
- End‑to‑end MLOps pipeline from dataset research to live predictions
- Enterprise‑grade observability with ELK
- Advanced frontend data visualization patterns
- Reproducible scientific methodology


---

## License

This project is licensed under the MIT License.