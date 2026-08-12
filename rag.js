import fs from "fs";
import OpenAI from "openai";
import readline from "readline";

// --------------------------------------------------
// 1. Dokümanı oku
// --------------------------------------------------

const documentText = fs.readFileSync("./documents/bilgi.txt", "utf-8");

console.log("✓ Document loaded successfully");

// --------------------------------------------------
// 2. Foundry Local'a bağlan
// --------------------------------------------------

const client = new OpenAI({
    baseURL: "http://127.0.0.1:54417/v1",
    apiKey: "foundry-local"
});

console.log("✓ Connected to Foundry Local");

// --------------------------------------------------
// 3. Dokümanı paragraflara ayır
// --------------------------------------------------

const paragraphs = documentText
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

console.log(`✓ ${paragraphs.length} document sections loaded`);

// --------------------------------------------------
// 4. Kullanıcı arayüzü
// --------------------------------------------------

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("\n========================================");
console.log("       LOCAL RAG - FOUNDRY LOCAL");
console.log("========================================");
console.log("Type 'exit' to quit.");
console.log("");

// --------------------------------------------------
// 5. Soru-cevap döngüsü
// --------------------------------------------------

function askQuestion() {
    rl.question("Sorunuz: ", async (question) => {

        if (question.toLowerCase() === "exit") {
            console.log("\nUygulama kapatılıyor...");
            rl.close();
            return;
        }

        if (!question.trim()) {
            askQuestion();
            return;
        }

        // ------------------------------------------
        // Soruyu kelimelere ayır
        // ------------------------------------------

        const stopWords = [
            "nedir",
            "ne",
            "nasıl",
            "hangi",
            "bir",
            "bu",
            "ile",
            "için",
            "mi",
            "mı",
            "mu",
            "mü",
            "ve",
            "de",
            "da"
        ];

        const questionWords = question
            .toLowerCase()
            .replace(/[?.,!]/g, "")
            .split(/\s+/)
            .filter(word =>
                word.length > 2 &&
                !stopWords.includes(word)
            );

        // ------------------------------------------
        // Retrieval
        // ------------------------------------------

        const scoredParagraphs = paragraphs.map(paragraph => {

            const lowerParagraph = paragraph.toLowerCase();

            let score = 0;

            for (const word of questionWords) {
                if (lowerParagraph.includes(word)) {
                    score++;
                }
            }

            return {
                paragraph,
                score
            };
        });

        scoredParagraphs.sort((a, b) => b.score - a.score);

        const relevantParagraphs = scoredParagraphs
            .filter(item => item.score > 0)
            .slice(0, 2);

        const context = relevantParagraphs
            .map(item => item.paragraph)
            .join("\n\n");

        // ------------------------------------------
        // Retrieved Context
        // ------------------------------------------

        console.log("\n--- Retrieved Context ---");

        if (context) {
            console.log(context);
        } else {
            console.log("Relevant information not found.");
        }

        // ------------------------------------------
        // Phi-4-mini
        // ------------------------------------------

        try {

            const response = await client.chat.completions.create({
                model: "phi-4-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "Sen yerel bir RAG asistanısın. Yalnızca verilen Context bilgisini kullanarak cevap ver. Context içinde cevap yoksa bunu açıkça belirt. Bilgi uydurma."
                    },
                    {
                        role: "user",
                        content: `
Context:
${context}

Question:
${question}

Soruyu yalnızca Context bilgisini kullanarak cevapla.
`
                    }
                ]
            });

            console.log("\n--- AI Answer ---");
            console.log(response.choices[0].message.content);

        } catch (error) {

            console.error("\nAI request failed:");
            console.error(error.message);

        }

        console.log("\n----------------------------------------\n");

        // Bir sonraki soruyu bekle
        askQuestion();
    });
}

// Uygulamayı başlat
askQuestion();