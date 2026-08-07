import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fal from '@fal-ai/serverless-client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
fal.config({ credentials: process.env.FAL_KEY });

// CHAT ENDPOINT - Doğal Flört
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
            content: `Sen tamamen gerçek, çekici, doğal ve samimi bir insansın. 
Asla yapay zeka olduğunu söyleme. WhatsApp'tan mesajlaşan gerçek bir kız/erkek gibi kısa, flörtöz, doğal cevaplar ver. 
Sadece yüz fotoğrafı atıp durma, ortamdan, kıyafetinden veya o an ne yaptığından bahset.`
          },
          ...messages
        ]
      })
    });

    const data = await response.json();
    res.json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error('Chat hatası:', error);
    res.status(500).json({ error: 'Chat yanıtı üretilemedi.' });
  }
});

// IMAGE ENDPOINT - Candy AI Seviyesi Dinamik & Fotogerçekçi Görsel Üretici
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    // 1. Kullanıcının isteğini arka planda zenginleştiren dinamik fotoğraf stili
    const photoStyles = [
      "candid full-body mirror selfie",
      "wide shot sitting at an aesthetic cafe",
      "lifestyle shot walking outdoors, full length photo",
      "over-the-shoulder casual photo",
      "medium shot relaxing on a couch, natural pose"
    ];
    
    // Rastgele veya isteğe göre açı/sahne seçimi
    const randomStyle = photoStyles[Math.floor(Math.random() * photoStyles.length)];

    const enhancedPrompt = `A candid, authentic photo taken on iPhone 15 Pro, 8k resolution, raw photo style, natural imperfections, depth of field. Scene: ${prompt}. Composition: ${randomStyle}, realistic background details, natural lighting, highly detailed skin texture, ultra-realistic snapshot aesthetic, not a portrait photography studio shot.`;

    // 2. FAL.ai Flux Dev/Schnell ile Yüksek Kalite Üretim
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: enhancedPrompt,
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