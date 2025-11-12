import { GoogleGenerativeAI } from '@google/generative-ai';

import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import fs from "fs";
import path from "path";

class AIHelper {
  constructor() {
    // Use Singleton Pattern
    if (AIHelper.instance) {
      return AIHelper.instance;
    }

    this.model = 'gemini-2.0-flash';

    // Root SDK
    this.ai = new GoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Wrapper of LangChain
    this.llm = new ChatGoogleGenerativeAI({
      model: this.model,
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Temp dir to handle load file
    this.tempDir = './temp';
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);

    AIHelper.instance = this;
  }

  async generateText(allUnformattedAns, queryText) {
    // Define prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that explains highlighted text from user notes.
      ### Context:
      {allUnformattedAns}

      ### Task:
      Explain the following text briefly and clearly:
      "{queryText}"

      Formatting rules:
      - Use **only** the following HTML tags: <p>, <strong>, <b>, <em>, <i>.
      - Do not use any other HTML tags (no <div>, <span>, <ul>, etc.).
      - Keep your explanation under 80 words.
      - Avoid repeating the question.
      - Be concise and direct.
      `);

    const formattedPrompt = await prompt.format({
      allUnformattedAns,
      queryText,
    });
    // console.log("FORMATTED PROMPT: ", formattedPrompt);

    const messages = [
      new SystemMessage("You are a helpful assistant."),
      new HumanMessage(formattedPrompt),
    ];

    const response = await this.llm.invoke(messages);

    const text = response.content || "⚠️ No text returned";

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

    // console.log("Summarize File: ", result);
    return result;
  }

  async loadFile(noteDocsId, fileUrl, extension) {
    const supportedExtensions = ["pdf", "docx", "txt", "pptx"];

    // Validate extension
    if (!supportedExtensions.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}. Supported: ${supportedExtensions.join(", ")}`);
    }

    // Fetch file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    let loader;
    let tempPath = null;

    try {
      if (extension === "pdf") {
        // PDF can be loaded directly from Blob
        loader = new WebPDFLoader(
          new Blob([arrayBuffer], { type: "application/pdf" })
        );
      } else {
        // Other formats need temporary file
        tempPath = path.join(
          this.tempDir,
          `${Date.now()}_${noteDocsId}.${extension}`
        );
        fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

        // Select appropriate loader
        const loaders = {
          docx: DocxLoader,
          txt: TextLoader,
          pptx: PPTXLoader,
        };

        const LoaderClass = loaders[extension];
        loader = new LoaderClass(tempPath);
      }

      const docs = await loader.load();
      return docs;

    } finally {
      // Clean up temporary file
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (error) {
          console.error(`Failed to delete temp file ${tempPath}:`, error);
        }
      }
    }
  }
}

const instance = new AIHelper();
Object.freeze(instance);

export default instance;
