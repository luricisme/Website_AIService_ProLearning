import supabaseHelper from "../../helpers/supabaseHelper.js";
import aiHelper from "../../helpers/AIHelper.js";

class NotesController {
    async explainWithAI(req, res) {
        const { noteId, queryText } = req.body;
        // console.log("Query text " + queryText);

        const results = await supabaseHelper.queryDocuments(queryText, noteId);

        let allUnformattedAns = '';
        results && results.forEach(item => {
            allUnformattedAns += item.pageContent;
        });

        const answer = await aiHelper.generateText(allUnformattedAns, queryText);

        return res.status(200).json({
            success: true,
            message: "Query successfully",
            data: answer
        });
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

            const data = await aiHelper.summarizeTextByChain(noteDocsId, fileUrl, extension);

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
}

export default new NotesController();