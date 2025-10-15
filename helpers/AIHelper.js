import { GoogleGenAI, } from '@google/genai';

import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import fs from "fs";
import path from "path";

class AIHelper {
  constructor() {
    if (AIHelper.instance) {
      return AIHelper.instance;
    }

    this.model = 'gemini-2.0-flash';

    // SDK gốc
    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // LangChain Wrapper
    this.llm = new ChatGoogleGenerativeAI({
      model: this.model,
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    AIHelper.instance = this;
  }

  async generateText(prompt) {
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    console.log("Gemini full response:", JSON.stringify(response, null, 2));

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No text returned';

    return text.trim();
  }

  async summarizeTextByChain(noteDocsId, fileUrl, extension) {
    const docs = await this.loadFile(noteDocsId, fileUrl, extension);

    // Define prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that summarizes documents.

      ### Task:
      Summarize the main themes in the following documents clearly and concisely:
      {context}

      ### Formatting rules:
      - Use only these HTML tags: <p>, <strong>, <b>, <em>, <i>.
      - Do not use any other HTML tags (no <div>, <span>, <ul>, <ol>, <li>, <table>, etc.).
      - Do not include code block markers like \`\`\`html or \`\`\`.
      - Keep the summary under 150 words.
      - Write in a natural, readable tone.
    `);

    // Instantiate
    const chain = await createStuffDocumentsChain({
      llm: this.llm,
      outputParser: new StringOutputParser(),
      prompt,
    });

    let result = await chain.invoke({ context: docs });
    result = result.replace(/```html|```/gi, "").trim();
    result = result.replace(/<(?!\/?(p|strong|b|em|i)\b)[^>]*>/gi, "");

    console.log("Result:", result);
    return result;
  }

  async loadFile(noteDocsId, fileUrl, extension) {
    // Read file from URL
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();

    let loader;
    const tempDir = "./temp";
    let tempPath = '';
    if (extension === "pdf") {
      loader = new WebPDFLoader(new Blob([arrayBuffer], { type: "application/pdf" }));
    } else if (extension === "docx" || extension === "txt" || extension === "pptx") {
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      tempPath = path.join(tempDir, `${Date.now()}_${noteDocsId}`);
      fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

      if (extension === "docx") {
        loader = new DocxLoader(tempPath);
      } else if (extension === "txt") {
        loader = new TextLoader(tempPath);
      } else if (extension === "pptx") {
        loader = new PPTXLoader(tempPath);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${extension}`,
      });
    }

    // Load and read
    const docs = await loader.load();

    // let fileContent = '';
    // docs.forEach(doc => {
    //   fileContent = fileContent + doc.pageContent;
    // });

    // return fileContent;
    return docs;
  }
}

const instance = new AIHelper();
Object.freeze(instance);

export default instance;
