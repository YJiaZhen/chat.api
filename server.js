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
console.log('pool',pool)
// 配置 OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 中介軟體
app.use(cors());
app.use(bodyParser.json());

const apiKey = 'iam-roy';  // 將這個替換為你的實際API密鑰

// 中間件函數用於檢查API密鑰
function authenticateApiKey(req, res, next) {
  const userApiKey = req.get('X-API-Keyf');
  console.log('!!!middleware')
  if (userApiKey && userApiKey === apiKey) {
    next();
  } else {
    res.status(401).json({ error: '未經授權的訪問' });
  }
}
function log(req, res, next){
    console.log('middleware22',req.headers)
    next();
}
// 在路由中使用認證中間件
app.get('/health',[authenticateApiKey, log], (req, res) => {
    console.log('!!!')
  res.send('我還活著');
});
// 搜尋相似訊息並翻譯的 API
app.post('/api/chat', async (req, res) => {
    const {message} = req.body;

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
async function translateText(answer, originalMessage, temperature = 0.3) {
    console.log('answer',answer)
    // 改進的語言檢測
    const detectLanguage = (text) => {
        // 日文檢測（優先檢測）
        // 檢查是否包含平假名或片假名，這是日文的唯一特徵
        if (/[\u3040-\u309F]|[\u30A0-\u30FF]/.test(text)) {
            return 'ja';
        }
        
        // 韓文檢測
        if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
            return 'ko';
        }

        // 中文檢測
        // 只包含漢字而不包含假名才判斷為中文
        if (/[\u4E00-\u9FFF]/.test(text) && 
            !/[\u3040-\u309F]|[\u30A0-\u30FF]/.test(text)) {
            return 'zh';
        }

        // 預設為英文
        return 'en';
    };

    // 獲取語言顯示名稱
    const getLanguageName = (langCode) => {
        const langMap = {
            'zh': 'Traditional Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'en': 'English'
        };
        return langMap[langCode];
    };

    // 更詳細的語言檢測日誌
    const inputLanguage = detectLanguage(originalMessage);
    console.log('Detected language:', {
        text: originalMessage.substring(0, 50), // 只記錄前50個字符
        detectedLanguage: inputLanguage,
        hasHiragana: /[\u3040-\u309F]/.test(originalMessage),
        hasKatakana: /[\u30A0-\u30FF]/.test(originalMessage),
        hasKanji: /[\u4E00-\u9FFF]/.test(originalMessage),
        hasHangul: /[\uAC00-\uD7AF\u1100-\u11FF]/.test(originalMessage)
    });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { 
                    role: "system", 
                    content: `You are a translator with strict language controls.
                    
                    CURRENT_INPUT_LANGUAGE: ${getLanguageName(inputLanguage)}
                    
                    STRICT RULES:
                    1. You MUST respond ONLY in ${getLanguageName(inputLanguage)}
                    2. ANY mixing of languages is FORBIDDEN
                    3. Keep all technical terms, code, URLs, and Markdown syntax unchanged
                    4. Preserve all formatting and structure
                    5. For Chinese translations, always use Traditional Chinese (zh-tw)
                    
                    VALIDATION:
                    - If input is English: Output MUST be 100% English
                    - If input is Chinese: Output MUST be 100% Traditional Chinese
                    - If input is Japanese: Output MUST be 100% Japanese
                    - If input is Korean: Output MUST be 100% Korean
                    - NO exceptions to these language rules are allowed
                    
                    SPECIAL NOTES:
                    - Technical terms may be kept in English if that's the common practice in the target language
                    - Programming code blocks must remain unchanged
                    - URLs and file paths must remain unchanged
                    - If input contains mixed languages, prioritize the dominant language
                    - Maintain all original line breaks, spacing, and punctuation`
                },
                { 
                    role: "user", 
                    content: `ORIGINAL_LANGUAGE: ${getLanguageName(detectLanguage(answer))}
                    TARGET_LANGUAGE: ${getLanguageName(inputLanguage)}
                    
                    CONTENT_TO_TRANSLATE: ${answer}`
                }
            ],
            temperature: temperature
        });

        const translatedText = response.choices[0].message.content.trim();
        
        // 驗證翻譯結果的語言
        const outputLanguage = detectLanguage(translatedText);
        
        // 記錄翻譯結果的語言檢測
        console.log('Translation result:', {
            originalLanguage: detectLanguage(answer),
            targetLanguage: inputLanguage,
            outputLanguage: outputLanguage,
            matchesTarget: outputLanguage === inputLanguage,
            sampleOutput: translatedText.substring(0, 50) // 只記錄前50個字符
        });

        // 檢查輸出語言是否符合目標語言
        if (outputLanguage !== inputLanguage) {
            console.error('Language mismatch detected. Retrying translation...');
            // 如果語言不匹配，重試翻譯，但要防止無限遞迴
            // 可以加入重試次數限制
            return translateText(answer, originalMessage, temperature);
        }

        return translatedText;
    } catch (error) {
        console.error('Translation error:', {
            error: error.message,
            inputLanguage,
            originalText: originalMessage.substring(0, 50)
        });
        throw new Error(`Translation failed: ${error.message}`);
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