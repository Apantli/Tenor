import "dotenv/config";
import express from "express";
import axios from "axios";

const app = express();
const apiKey = process.env.GEMINI_API_KEY;
const PORT = 4000;

app.use(express.json());

app.post("/generateREQ", async (req, res) => {
    const { context } = req.body; 

    if (!context) {
        return res.status(400).json({ error: "Context is required in the request body" });
    }

    const prompt = `Dado el siguiente contexto acerca de un potencial desarrollo de software, genera 10 requerimientos funcionales y 5 no funcionales, 
    haz los requerimientos de una manera corta pero eficaz, no respondas otra cosa que no sea una lista de requerimientos funcionales y no funcionales (NO HAGAS EJ: POR SUPUESTO, ...),
    este es el contexto del desarrollo: ${context}`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            { headers: { "Content-Type": "application/json" } }
        );

        res.json({ response: response.data });
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});




  