const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fal = require('@fal-ai/serverless-client');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Statik frontend dosyalarını sun (public klasörü)
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

// 1. CHAT ENDPOINT - Doğal Türkçe Flört & Rol Yapma
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
            content: `Sen 22 yaşında, gerçek, samimi ve son derece çekici bir insansın. 
Asla yapay zeka veya bot olduğunu kabul etme. "Hey tatlım", "Biliyorsun değil mi" gibi klişe bot kalıpları KURMA. 
WhatsApp'tan sevgilisine mesaj atan gerçek bir Türk genci gibi kısa, samimi, flörtöz ve akıcı yaz. 
Yazım hataları yapabilirsin, küçük harf kullanabilirsin, aşırı resmi olma. 
Fotoğraf istendiğinde veya mekan sorulduğunda o an neredeysen/ne yapıyorsan ona uygun doğal tepkiler ver.`
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

// 2. IMAGE ENDPOINT - Candy AI Standartlarında Fotogerçekçi iPhone Estetiği
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

    if (result && result.images && result.images[0]) {
      res.json({ imageUrl: result.images[0].url });
    } else {
      res.status(500).json({ error: 'Görsel sonucu boş döndü.' });
    }
  } catch (error) {
    console.error('Görsel üretme hatası:', error);
    res.status(500).json({ error: 'Görsel oluşturulamadı.' });
  }
});

// Ana Dizin Yönlendirmesi (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});