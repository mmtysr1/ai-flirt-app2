import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fal from '@fal-ai/serverless-client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase & Fal Yapılandırması
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
fal.config({ credentials: process.env.FAL_KEY });

// 1. CHAT ENDPOINT - Doğal & Gerçekçi Flört Modeli
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
        model: "gryphe/mythomax-l2-13b", // Flört ve insanımsı rol yapmada en başarılı model
        temperature: 0.85, // Gerçekçi ve samimi tepki oranı
        messages: [
          {
            role: "system",
            content: `Sen tamamen gerçek, çekici, doğal ve samimi bir insansın. 
Asla bir yapay zeka veya bot olduğunu kabul etme. 
Resmi, uzun, ezberlenmiş ya da yapay cümleler KURMA. 
WhatsApp'tan mesajlaşan gerçek bir kız/erkek gibi kısa, flörtöz, doğal, anlık tepkiler ver. 
Yazım hataları yapabilirsin, küçük harfler kullanabilirsin, samimi ve doğal ol.`
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

// 2. IMAGE ENDPOINT - Candy AI Ayarında Fotogerçekçi Görsel Üretimi
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Görseli gerçekçi kılacak teknik Flux promptu
    const enhancedPrompt = `Hyper-realistic candid photo, 8k resolution, raw photo, realistic skin texture, highly detailed features, natural soft lighting, instagram aesthetic, shot on 35mm lens, portrait of an attractive person: ${prompt}`;

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