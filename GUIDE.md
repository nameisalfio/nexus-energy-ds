# Guida alla Presentazione – Nexus Energy Distributed Service

Lista di todo per la presentazione al professore. Ogni punto è una checkbox da spuntare; il testo sotto è la spiegazione teorica da usare.

---

## PARTE 1 – Introduzione

- [ ] **1.1** Presentare il progetto

**Spiegazione:** Nexus Energy è una piattaforma full-stack distribuita per il monitoraggio e l’analisi predittiva del consumo energetico negli edifici. L’obiettivo è mostrare come integrare tecnologie diverse (frontend, backend, AI, database, messaging, osservabilità) in un’architettura pronta per la produzione. Il cuore del sistema è il **Digital Energy Twin**: un modello neurale che predice il consumo e lo confronta con i dati reali per individuare inefficienze e anomalie. Il dataset usato è [Energy Consumption Prediction su Kaggle](https://www.kaggle.com/datasets/mrsimple07/energy-consumption-prediction).

---

## PARTE 2 – Server (energy-server) – Analisi dettagliata

- [ ] **2.1** Spiegare in dettaglio cosa fa il server

**Spiegazione:** Il server è il cuore dell’architettura. Espone API REST per autenticazione, simulazione, report e streaming in tempo reale. La logica è centralizzata in una **Remote Facade**: invece di esporre molti endpoint granulari, espone operazioni aggregate che il controller mappa su pochi endpoint. Il flusso dati è questo: l’utente carica un CSV → un servizio di ingestione lo parsa e carica i record in una coda interna → a intervalli fissi la simulazione estrae un record, lo salva tramite un servizio di persistenza (protetto da Circuit Breaker), pubblica un evento → la Facade riceve l’evento, invoca il modello AI per la predizione LSTM, genera un report aggregato e lo invia a tutti i client connessi in tempo reale. La Facade mantiene uno snapshot volatile e una lista di connessioni per gestire più client in parallelo. All’avvio il sistema pulisce la telemetria precedente e inizializza lo snapshot. Il Circuit Breaker usa una finestra scorrevole di chiamate, una soglia di fallimento e uno stato aperto per un tempo definito prima di tentare di nuovo. I log sono inviati sia su console che a un sistema centralizzato via TCP in formato JSON strutturato.

---

## PARTE 3 – RabbitMQ – Analisi dettagliata

- [ ] **3.1** Spiegare il ruolo di RabbitMQ e i pattern usati

**Spiegazione:** RabbitMQ non è usato come coda principale, ma come **fallback** quando il database non è raggiungibile. Il pattern è **Circuit Breaker + Event-Driven Fallback**. Quando il salvataggio su database fallisce (DB down, timeout), il Circuit Breaker invoca un fallback: il servizio incrementa un contatore di fallimenti, annota il contesto per i log, e invia la lettura energetica su RabbitMQ. La configurazione prevede un **TopicExchange**, una routing key dedicata, e una **Quorum Queue** (durable, TTL configurato, delivery limit, Dead Letter Queue per messaggi non processabili). I messaggi sono serializzati in JSON con informazioni per la deserializzazione sicura. Il publisher ha callback per confermare la ricezione e per loggare messaggi non instradabili. Un servizio di recovery consuma la coda con concorrenza configurata: verifica duplicati, salva nel DB e aggiorna l’audit. Se il salvataggio fallisce (DB ancora down), rilancia l’eccezione per far riaccodare il messaggio. Pattern: **Message Queue**, **Dead Letter Queue**, **Publisher-Confirm**, **Self-Healing Consumer**.

---

## PARTE 4 – ELK Stack e Bot Telegram – Analisi dettagliata

- [ ] **4.1** Spiegare la pipeline ELK e l’integrazione Telegram

**Spiegazione:** L’ELK Stack raccoglie, trasforma e visualizza i log del server. Il sistema di logging invia tutti i log di livello INFO e superiori a Logstash via TCP, producendo JSON strutturato (timestamp, livello, messaggio, contesto, ecc.). Logstash riceve i log, applica filtri (normalizzazione timestamp, conversione campi per eventi di anomalia), e invia a Elasticsearch con indici giornalieri. Inoltre Logstash ha due output HTTP condizionali verso l’API Telegram: (1) se il messaggio contiene un pattern di stress database, invia un alert al gruppo Telegram; (2) se contiene un pattern di anomalia AI, invia un alert con i valori di deviazione. Il server produce questi messaggi quando il fallback viene attivato (stress DB) e quando il modello rileva un’anomalia oltre la soglia (deviazione superiore al 20%). Kibana si connette a Elasticsearch e permette di creare dashboard sui log indicizzati. Pattern: **Centralized Logging**, **Structured Logging**, **Alerting on Log Patterns**.

---

## PARTE 5 – Pattern architetturali – Riepilogo preciso

- [ ] **5.1** Elencare i pattern con dove e perché sono usati

**Spiegazione:**

| Pattern | Dove | Perché |
|--------|------|--------|
| **Remote Facade** | Logica server, endpoint aggregati | Aggrega report, statistiche e snapshot in una risposta; riduce chiamate HTTP |
| **Command** | Endpoint di avvio/stop simulazione | Incapsula azioni eseguibili dall’utente |
| **Observer** | Connessioni SSE, notifiche eventi | Server notifica i client in tempo reale senza polling |
| **Circuit Breaker** | Servizio di persistenza | Evita di sovraccaricare il DB; apre il circuito e usa fallback |
| **Event-Driven Fallback** | Fallback → RabbitMQ | In caso di DB down, i dati vanno in coda invece di essere persi |
| **Self-Healing** | Consumer della coda di fallback | Consuma la coda e riconcilia nel DB quando torna operativo |
| **Message Queue** | RabbitMQ Quorum Queue | Buffer persistente per telemetria in attesa di scrittura |
| **Dead Letter Queue** | Coda secondaria della fallback | Messaggi non processabili dopo N tentativi |
| **BFF** | Chiamate client agli endpoint aggregati | Una risposta aggregata invece di molte |
| **Repository** | Astrazione accesso dati | Separazione tra logica e persistenza |
| **Publisher-Confirm** | Publisher RabbitMQ | Verifica che il broker abbia ricevuto i messaggi |
| **Centralized Logging** | Pipeline log → Logstash → Elasticsearch | Log in un unico posto, ricercabili |
| **Alerting on Log Patterns** | Filtri Logstash → Telegram | Notifiche proactive su eventi critici |

---

## PARTE 6 – Frontend (FE)

- [ ] **6.1** Spiegare cosa fa il frontend

**Spiegazione:** Il frontend è una SPA React con TypeScript, Vite e Tailwind. Offre due dashboard: una per **ADMIN** (avvio/stop simulazione, caricamento CSV, gestione utenti) e una per **USER** (solo lettura). Usa il modello **BFF**: invece di tante chiamate API, usa endpoint aggregati che restituiscono tutto in una risposta. Per i dati in tempo reale si sottoscrive allo stream SSE e aggiorna i grafici (consumo reale vs predetto, trend settimanali) senza polling. Tecniche di gestione dello stato mantengono l’interfaccia stabile durante gli aggiornamenti continui.

---

## PARTE 7 – AI e Digital Twin

- [ ] **7.1** Spiegare il modello AI e il Digital Twin

**Spiegazione:** Il sistema integra una rete LSTM addestrata. Il modello usa una finestra temporale di 12 timestep (temperatura, umidità, occupanza, consumo) per predire il consumo dell’ora successiva. Ogni nuova lettura viene confrontata con la predizione: se la deviazione supera il 20% viene segnalata un’anomalia e viene generato un suggerimento. Il training avviene offline; il modello e il normalizer sono salvati e caricati all’avvio. Le scelte di feature engineering e normalizzazione sono allineate al notebook Python per garantire riproducibilità.

---

## PARTE 8 – Notebook analysis.ipynb

- [ ] **8.1** Spiegare il notebook di analisi

**Spiegazione:** Il notebook di analisi è la base analitica del progetto. Contiene l’EDA (analisi esplorativa dei dati) sul dataset Energy Consumption: caricamento dati, preprocessing, estrazione di feature temporali (ora, giorno, mese), encoding ciclico (sin/cos), analisi di correlazioni e stagionalità. Include anche un modello LSTM in PyTorch per validare l’approccio e ottenere un MAE di riferimento. Le scelte fatte nel notebook (feature, normalizzazione, finestra temporale) sono poi applicate nel backend, mantenendo coerenza tra ricerca e produzione.

---

## PARTE 9 – Sicurezza

- [ ] **9.1** Spiegare la sicurezza

**Spiegazione:** L’autenticazione è basata su **JWT stateless**: al login viene emesso un token firmato che il client invia nell’header Authorization. Un JWT è composto da tre parti: un header (algoritmo e tipo), un payload (identità, ruolo, scadenza) e una firma crittografica che garantisce integrità e autenticità. Il controllo degli accessi è **RBAC**: il ruolo ADMIN può avviare/fermare la simulazione, cancellare dati e gestire utenti; il ruolo USER ha solo accesso in lettura. Al logout il token viene inserito in una blacklist per evitare riuso: il client comunica al server il token da invalidare, e il server rifiuta le richieste che lo presentano ancora. Le password sono hashate con BCrypt prima di essere salvate nel database.

---

## PARTE 10 – Avvio e Demo

- [ ] **10.1** Avviare il sistema e fare la demo

**Spiegazione:** Creare un file di configurazione con le variabili per MySQL, JWT e RabbitMQ. Eseguire il comando di avvio con Docker e attendere l’avvio completo (circa 2–4 minuti). Verificare lo stato del server con un endpoint di health. Aprire il client, registrare un utente, fare login e (se necessario) promuoverlo ad ADMIN. Caricare un dataset CSV, avviare la simulazione e mostrare lo streaming in tempo reale, i grafici e gli insight del Digital Twin. Per mostrare il Bot Telegram: simulare un DB down (es. spegnere il container MySQL) e far partire la simulazione; i log di stress attiveranno l’invio dell’alert su Telegram. Per le anomalie AI: lasciare girare la simulazione; quando la deviazione supera il 20% verrà inviato l’alert. Mostrare Kibana per i log e RabbitMQ per code e messaggi in fallback.

---

*Usa le checkbox come promemoria e le spiegazioni come testo da esporre.*
