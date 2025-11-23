import supabaseHelper from "../../helpers/supabaseHelper.js";
import aiHelper from "../../helpers/AIHelper.js";
import noteAgent from "../../helpers/NoteAgent.js";

class NotesController {
    async explainWithAI(req, res) {
        try {
            const { noteId, queryText } = req.body;

            // Validate input
            if (!noteId || !queryText) {
                return res.status(400).json({
                    success: false,
                    message: "noteId và queryText là bắt buộc.",
                });
            }

            // Query context từ Supabase
            const results = await supabaseHelper.queryDocuments(queryText, noteId);

            // Gộp nội dung làm context
            let context = "";
            if (results && results.length > 0) {
                context = results.map((item) => item.pageContent).join("\n\n");
            } else {
                context = "No relevant context found.";
            }

            // Gọi AI Helper trực tiếp
            const explanation = await aiHelper.explainNote(context, queryText);

            return res.status(200).json({
                success: true,
                message: "Giải thích thành công.",
                data: explanation,
            });
        } catch (error) {
            console.error("Explain with AI error:", error);
            return res.status(500).json({
                success: false,
                message: "Lỗi khi giải thích đoạn text.",
                error: error.message,
            });
        }
    }

    async explainWithAIAgent(req, res) {
        try {
            const { noteId, queryText } = req.body;

            // Validate input
            if (!noteId) {
                return res.status(400).json({
                    success: false,
                    message: "noteId are required",
                });
            }

            // Query documents from Supabase
            const results = await supabaseHelper.queryDocuments(queryText, noteId);

            // Combine context
            let context = '';
            if (results && results.length > 0) {
                context = results.map(item => item.pageContent).join('\n\n');
            }

            // Use agent to explain
            const input = `Context from user notes:
                ${context}

                Please explain the following text briefly and clearly:
                "${queryText}"

                Keep your explanation under 80 words and use only HTML tags: <p>, <strong>, <b>, <em>, <i>.`;

            const result = await noteAgent.run(input);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to generate explanation",
                    error: result.error,
                });
            }

            return res.status(200).json({
                success: true,
                message: "Query successfully",
                data: result.output,
            });

        } catch (error) {
            console.error("Explain with AI error:", error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    async summaryFileWithAI(req, res) {
        try {
            const { noteDocsId, fileUrl, extension } = req.body;

            if (!noteDocsId || !fileUrl || !extension) {
                return res.status(400).json({
                    success: false,
                    message: "Missing metadata",
                });
            }

            const data = await aiHelper.summarizeNoteByChain(noteDocsId, fileUrl, extension);

            return res.status(200).json({
                success: true,
                message: "Summarize file successfully",
                data: data,
            });
        } catch (error) {
            console.error("Error summarizing file:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to summarize file",
                error: error.message,
            });
        }
    }

    async summaryFileWithAIAgent(req, res) {
        try {
            const { noteDocsId, fileUrl, extension } = req.body;

            // Validate input
            if (!noteDocsId || !fileUrl || !extension) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: noteDocsId, fileUrl, extension",
                });
            }

            // Use agent
            const input = `Please summarize this ${extension.toUpperCase()} document.
                File URL: ${fileUrl}
                Document ID: ${noteDocsId}
                Extension: ${extension}

                Use the summarize_document tool to process this file.`;

            const result = await noteAgent.run(input);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to summarize file",
                    error: result.error,
                });
            }

            return res.status(200).json({
                success: true,
                message: "Summarize file successfully",
                data: result.output,
            });

        } catch (error) {
            console.error("Error summarizing file:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to summarize file",
                error: error.message,
            });
        }
    }
}

export default new NotesController();