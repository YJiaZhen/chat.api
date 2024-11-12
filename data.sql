CREATE TABLE chatbot (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE embeddings (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbot(id) ON DELETE CASCADE,
    embedding VECTOR(1536) NOT NULL
);

CREATE EXTENSION IF NOT EXISTS vector;
