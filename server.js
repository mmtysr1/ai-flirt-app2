const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fal = require('@fal-ai/serverless-client');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

// 1. CHAT ENDPOINT
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gryphe/mythomax-l2-13b",
        temperature: 0.85,
        messages: [
          {
            role: "system",
            content: `Sen 22 yaşında, gerçek, samimi ve doğal bir insansın. 
Asla yapay zeka olduğunu söyleme. "Hey tatlım", "biliyorsun değil mi" gibi yapay/robotik bot cümleleri KURMA. 
WhatsApp'tan sevgilisine mesaj atan gerçek bir Türk genci gibi konuş. Kısa, samimi, doğal ve akıcı yaz. 
Fotoğraf istendiğinde veya ortam sorulduğunda o anki mekana uygun davran.`
          },
          ...(messages || [])
        ]
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      res.json({ message: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'Model yanıt vermedi.' });
    }
  } catch (error) {
    console.error('Chat hatası:', error);
    res.status(500).json({ error: 'Chat yanıtı üretilemedi.' });
  }
});

// 2. IMAGE ENDPOINT
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, chatHistory } = req.body;
    const userContext = prompt || chatHistory || "casual portrait";

    const hyperRealisticPrompt = `An authentic amateur candid smartphone photo, shot on front-facing iPhone 15 Pro camera, Snapchat aesthetic, 8k resolution, raw photography, natural lighting, subtle skin imperfections, visible pores, no heavy makeup, realistic eyes, unedited look. Context and setting: ${userContext}. Pose: natural relaxed pose matching the environment, realistic background depth.`;

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: hyperRealisticPrompt,
        image_size: "portrait_16_9",
        num_inference_steps: 4,
        enable_safety_checker: false
      }
    });

    res.json({ imageUrl: result.images[0].url });
  } catch (error) {
    console.error('Görsel üretme hatası:', error);
    res.status(500).json({ error: 'Görsel oluşturulamadı.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});