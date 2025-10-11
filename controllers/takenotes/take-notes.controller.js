import supabaseHelper from "../../helpers/supabaseHelper.js";
import aiHelper from "../../helpers/AIHelper.js";

class TakeNotesController {
    async explainWithAI(req, res) {
        const { queryText, noteId } = req.body;
        // console.log("Query text " + queryText);

        const results = await supabaseHelper.queryDocuments(queryText, noteId);

        let allUnformattedAns = '';
        results && results.forEach(item => {
            allUnformattedAns += item.pageContent;
        });

        const PROMPT = `
        You are an assistant that explains highlighted text from user notes.

        ### Context:
        ${allUnformattedAns}

        ### Task:
        Explain the following text briefly and clearly:
        "${queryText}"

        - Use HTML formatting in your response (e.g. <p>, <strong>, <em>).
        - Keep your explanation under 80 words.
        - Avoid repeating the question.
        - Be concise and direct.
        `;
        // console.log("PROMPT: " + PROMPT);

        const answer = await aiHelper.generateText(PROMPT);

        return res.status(200).json({
            success: true,
            message: "Query successfully",
            data: answer
        });
    }
}

export default new TakeNotesController();