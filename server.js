const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 3001;

// 設定資料庫連接池
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
    max: 5
});

// 配置 OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 中介軟體
app.use(cors());
app.use(bodyParser.json());



// 搜尋相似訊息並翻譯的 API
app.post('/api/chat', async (req, res) => {
    const { message} = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message and user language are required' });
    }

    try {
        // 生成訊息的嵌入向量
        const queryEmbedding = await generateEmbedding(message);

        // 查詢最相似的嵌入向量
        const result = await pool.query(
            'SELECT chatbot.message, chatbot.response, embeddings.embedding ' +
            'FROM embeddings ' +
            'JOIN chatbot ON embeddings.chatbot_id = chatbot.id ' +
            'ORDER BY (embedding <=> $1) LIMIT 1',
            [queryEmbedding]
        );

        if (result.rows.length > 0) {
            const { message: dbMessage, response: dbResponse } = result.rows[0];

            // 翻譯回應到用戶的語言
            const translatedResponse = await translateText(dbResponse, message);

            // 返回原始訊息和翻譯後的回應
            return res.status(200).json({
                originalMessage: dbMessage,
                translatedResponse: translatedResponse
            });
        }

        // 如果未找到相似的訊息，返回未找到的標誌
        res.status(404).json({ response: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});

// 使用 OpenAI 進行文本翻譯的函式
async function translateText(answer, originalMessage) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `你是一名專業翻譯。如果使用者的語系是英文就不用翻譯按照原本資料庫內容回覆，如果是其他語系請根據使用者語系翻譯內容，將以下文本翻譯成${originalMessage}。請只翻譯純文字內容mardown內容也要列出。盡可能保持原意和語氣。`},
                { role: "user", content: answer}
            ],
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error translating text:', error);
        throw new Error('Failed to translate text');
    }
}
// 使用 OpenAI 生成嵌入向量的函式
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });

        const embedding = response.data[0].embedding;

        if (embedding.length !== 1536) {
            throw new Error('Generated embedding does not match the expected dimension.');
        }

        return `[${embedding.join(',')}]`;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}



// 啟動伺服器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});