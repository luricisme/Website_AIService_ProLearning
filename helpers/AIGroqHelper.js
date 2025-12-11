import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";

import fs from "fs";
import path from "path";

class AIGroqHelper {
    constructor() {
        if (AIGroqHelper.instance) return AIGroqHelper.instance;

        this.model = "llama-3.3-70b-versatile";
        this.apiKey = process.env.GROQ_API_KEY;
        this.apiUrl = "https://api.groq.com/openai/v1/chat/completions";

        this.tempDir = "./temp";
        if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);

        AIGroqHelper.instance = this;
    }

    // ================================================================
    // CALL GROQ API DIRECTLY
    // ================================================================
    async callGroq(messages, temperature = 0, maxTokens = 2048) {
        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // ================================================================
    // EXPLAIN NOTE
    // ================================================================
    async explainNote(allUnformattedAns, queryText, lang) {
        const prompt = `You are an assistant that explains highlighted text from user notes.

### Based on this document content:
${allUnformattedAns}

### Task:
Explain the following text briefly and clearly in ${lang} language:
"${queryText}"

Formatting rules:
- Use only these HTML tags: <p>, <strong>, <b>, <em>, <i>.
- Keep the explanation under 80 words.
- Be concise.`;

        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
        ];

        const result = await this.callGroq(messages);
        return result.trim();
    }

    // ================================================================
    // SUMMARIZE NOTE
    // ================================================================
    async summarizeNoteByChain(assetId, fileUrl, extension, lang, limit) {
        const docs = await this.loadFile(assetId, fileUrl, extension);
        const context = docs.map(doc => doc.pageContent).join("\n\n");

        const prompt = `You are an assistant that summarizes documents.

### Task:
Summarize the main themes in the following text in ${lang} language:

${context}

### Rules:
- Use only <p>, <strong>, <b>, <em>, <i>
- No other HTML tags.
- Keep it under ${limit} words.`;

        const messages = [
            { role: "system", content: "You summarize documents." },
            { role: "user", content: prompt }
        ];

        let text = await this.callGroq(messages);

        // Cleanup
        text = text.replace(/```[^`]*```/g, "");
        text = text.replace(/<(?!\/?(p|strong|b|em|i)\b)[^>]*>/gi, "").trim();

        return text;
    }

    // ================================================================
    // FLASHCARD FROM FILE
    // ================================================================
    async generateFlashcardByFile(content) {
        const prompt = `You extract key concepts from a document and convert them into flashcards.

### Task:
Extract ALL important concepts and definitions.

Return in this format:
Word1|Definition1;Word2|Definition2;Word3|Definition3

### Rules:
- Output ONLY flashcards in the exact format.
- No HTML, no markdown, no quotes.
- Cover ALL main ideas in the content.

### Document:
${content}`;

        const messages = [
            { role: "system", content: "You generate flashcards." },
            { role: "user", content: prompt }
        ];

        console.log("🔥 Calling Groq API...");

        let result = await this.callGroq(messages);

        result = result
            .replace(/```[^`]*```/g, "")
            .replace(/```/g, "")
            .replace(/<[^>]*>/g, "")
            .trim();

        return result;
    }

    // ================================================================
    // FLASHCARD FROM HTML NOTE
    // ================================================================
    async generateFlashcardByNote(content) {
        const prompt = `You extract flashcards from HTML note content.

Format:
Word1|Definition1;Word2|Definition2;Word3|Definition3

Rules:
- Output ONLY pairs.
- No markdown, no HTML, no explanation.

### Document:
${content}`;

        const messages = [
            { role: "system", content: "You generate flashcards." },
            { role: "user", content: prompt }
        ];

        let result = await this.callGroq(messages);

        result = result
            .replace(/```[^`]*```/g, "")
            .replace(/```/g, "")
            .replace(/<[^>]*>/g, "")
            .trim();

        return result;
    }

    // ================================================================
    // LOAD FILE (PDF / DOCX / TXT / PPTX)
    // ================================================================
    async loadFile(docsId, fileUrl, extension) {
        const supported = ["pdf", "docx", "txt", "pptx"];
        if (!supported.includes(extension))
            throw new Error(`Unsupported file type: ${extension}`);

        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file");

        const arrayBuffer = await response.arrayBuffer();

        let loader;
        let tempPath = null;

        try {
            if (extension === "pdf") {
                loader = new WebPDFLoader(
                    new Blob([arrayBuffer], { type: "application/pdf" })
                );
            } else {
                tempPath = path.join(
                    this.tempDir,
                    `${Date.now()}_${docsId}.${extension}`
                );

                fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

                const loaders = {
                    docx: DocxLoader,
                    txt: TextLoader,
                    pptx: PPTXLoader,
                };

                const LoaderClass = loaders[extension];
                loader = new LoaderClass(tempPath);
            }

            return await loader.load();
        } finally {
            if (tempPath && fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                } catch (err) {
                    console.error("Failed to delete temp file", err);
                }
            }
        }
    }
}

const instance = new AIGroqHelper();
Object.freeze(instance);

export default instance;