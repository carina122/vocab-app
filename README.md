📚 WordBox — Vocabulary Flashcards
  A containerized vocabulary-learning web app deployed on Azure using microservices architecture, serverless computing, and blob storage.

Features
  ✅ Create and manage vocabulary decks

  ✅ Study flashcards with spaced repetition

  ✅ Track learning progress

  ✅ Upload vocabulary files for automatic deck generation

  ✅ RESTful API for all operations

  ✅ Serverless blob processing for file uploads

👤 User Information

  Overview:
  WordBox is a vocabulary-learning web application that allows users to create, study, and track progress on flashcard decks. The app features a clean, intuitive interface with six main pages: Home, My Decks, Study, Upload, Progress, and Profile.

Live URLs
  Frontend Application	http://48.201.68.211
  Backend API	http://20.170.98.228:4000
  Health Check	http://20.170.98.228:4000/healthz
  Function App	https://wordbox-vocab-processor.azurewebsites.net

OR

Local run (Docker, no Azure account needed)

  ```bash
  docker compose up --build
  # frontend → http://localhost:8080
  # backend  → http://localhost:4000/healthz
  ```

After opening the app, you can try and upload your own personalized .csv vocabulary file.

👨‍💻 Developer Information

  Architecture Overview
  ┌────────────────┐        REST (/api/*)        ┌──────────────────┐
  │  Frontend      │  ───────────────────────►   │  Backend         │
  │  Container(ACI)│  ◄───────────────────────   │  Container (ACI) │
  │  (Nginx +      │        JSON responses       │  (Node/Express)  │
  │  HTML/CSS/JS)  │                             │                  │
  └────────────────┘                             └─────────┬────────┘
        ▲  served via                                      │ SDK calls
        │  Public IP                                       ▼
        │                                        ┌─────────────────────┐
        │                                        │ Azure Blob Storage  │
        │                                        │ • wordbox-decks/    │
        │                                        │ • wordbox-uploads/  │
        │                                        └──────────┬──────────┘
        │                                                   │ blob-trigger
        │                                                   ▼
        │                                        ┌─────────────────────┐
        └────────────────────────────────────────┤ Azure Function App  │
                      end user's browser         │ (Flex Consumption)  │
                                                 │ ProcessVocabUpload  │
                                                 └─────────────────────┘
"# vocab-app" 
