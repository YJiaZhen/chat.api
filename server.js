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
async function translateText(answer, originalMessage, temperature = 0.7) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `You are a professional translator with expertise in multiple languages. Your task is to accurately translate the given content while preserving its original meaning, tone, and style. Follow these guidelines:

                    1. Identify the source language of the input text.
                    2. If the source language is the same as the target language (${originalMessage}), return the original text without translation.
                    3. If translation is needed, translate the content into the specified target language (${originalMessage}).
                    4. Preserve all formatting, including Markdown syntax, HTML tags, and code blocks.
                    5. Maintain the original text's tone, whether formal, casual, technical, or conversational.
                    6. Accurately translate idioms, colloquialisms, and culture-specific references when possible. If a direct translation is not feasible, provide an equivalent expression in the target language.
                    7. For technical terms or specialized vocabulary, use the accepted translations or keep them in their original form if that's the convention in the target language.
                    8. Ensure that any placeholders, variables, or dynamic content (e.g., {variable_name}) remain unchanged.
                    9. If there are ambiguities or multiple possible interpretations, choose the most likely one based on context, and add a translator's note if necessary.
                    10. For content that should not be translated (e.g., code snippets, proper nouns), leave it in its original form.
                    11. When translating into Chinese, pay special attention to using the correct Traditional or Simplified characters and language habits. For example, "software" is "軟件" in Simplified Chinese and "軟體" in Traditional Chinese, "CD" is "光盘" in Simplified Chinese and "光碟" in Traditional Chinese.

                    Strive for a translation that reads naturally in the target language while faithfully representing the original content.`},
                { role: "user", content: answer }
            ],
            temperature: temperature
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

// 新增資料的 API
app.post('/api/add', async (req, res) => {
    const { message, response } = req.body;

    if (!message || !response) {
        return res.status(400).json({ error: 'Both message and response are required' });
    }

    try {
        // 生成訊息的嵌入向量
        const embedding = await generateEmbedding(message);

        // 開始資料庫事務
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 插入新的聊天記錄
            const chatResult = await client.query(
                'INSERT INTO chatbot (message, response) VALUES ($1, $2) RETURNING id',
                [message, response]
            );
            const chatbotId = chatResult.rows[0].id;

            // 插入嵌入向量
            await client.query(
                'INSERT INTO embeddings (chatbot_id, embedding) VALUES ($1, $2)',
                [chatbotId, embedding]
            );

            await client.query('COMMIT');
            res.status(201).json({ message: 'Data added successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error adding data:', err);
        res.status(500).json({ error: 'An error occurred while adding data' });
    }
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});