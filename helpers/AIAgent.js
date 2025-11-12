import AIHelper from "./AIHelper.js";

class AIAgent {
    constructor() {
        if (AgentHelper.instance) {
            return AgentHelper.instance;
        }

        this.aiHelper = AIHelper;
        this.agentExecutor = null;

        AIAgent.instance = this;
    }

    async initAgent() {
        if (this.agentExecutor) return;

        // Tool 01: Summarize file
        
    }
}

const instance = new AgentHelper();
Object.freeze(instance);

export default instance;