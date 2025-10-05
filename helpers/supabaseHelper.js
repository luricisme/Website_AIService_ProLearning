import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

// https://js.langchain.com/docs/integrations/vectorstores/supabase/
export default class SupabaseHelper {
    constructor() {
        this.supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_PRIVATE_KEY
        );

        this.embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004", // 768 dimensions for Gemini embeddings
            taskType: TaskType.RETRIEVAL_DOCUMENT,
        });

        this.tableName = "documents";
    }

    /**
   * Add array of text chunks into Supabase as vectors
   * @param {string[]} textArray - List of text chunks
   * @param {object} metadata - Metadata (ex: note_id, filename, etc.)
   */
    async addDocuments(splitterList, metadata = {}) {
        try {
            const docs = splitterList.map((text) => ({
                pageContent: text,
                metadata
            }));

            const vectorStore = await SupabaseVectorStore.fromDocuments(
                docs,
                this.embeddings,
                {
                    client: this.supabaseClient,
                    tableName: this.tableName
                }
            );
            console.log(`✅ Inserted ${splitterList.length} chunks into Supabase`);
            return { success: true };
        } catch (error) {
            console.error("❌ Error adding documents to Supabase:", error);
            return { success: false, message: error.message };
        }
    }
}