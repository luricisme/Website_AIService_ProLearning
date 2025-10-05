import SupabaseHelper from "../../helpers/supabaseHelper.js";
import AIHelper from "../../helpers/AIHelper.js";

class TakeNotesController {
    async explainWithAI(req, res) {
        const { queryText, noteId } = req.body;
        console.log("Query text " + queryText);

        const supabaseHelper = new SupabaseHelper();
        const results = await supabaseHelper.queryDocuments(queryText, noteId);

        let allUnformattedAns = '';
        results && results.forEach(item => {
            allUnformattedAns += item.pageContent;
        });

        const PROMPT = "For question: " + queryText + " and with the given content as answer, please give appropriate answer in HTML format. The answer content is: " + allUnformattedAns;

        console.log("PROMPT: " + PROMPT);

        const aiHelper = new AIHelper();

        const answer = await aiHelper.generateText(PROMPT);

        return res.status(200).json({
            success: true,
            message: "Query successfully",
            data: answer
        });
    }
}

export default new TakeNotesController();