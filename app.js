import OpenAI from "openai";

console.log("Connecting to Foundry Local...");

const client = new OpenAI({
    baseURL: "http://127.0.0.1:49318/v1",
    apiKey: "foundry-local"
});

console.log("✓ Connected to Foundry Local");

console.log("\nSending question to Phi-4-mini...\n");

const response = await client.chat.completions.create({
    model: "phi-4-mini",
    messages: [
        {
            role: "user",
            content: "Merhaba! Kendini kısaca tanıt."
        }
    ]
});

console.log("AI RESPONSE:");
console.log(response.choices[0].message.content);