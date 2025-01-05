import OpenAIApi from 'openai';
import { getKey, hasKey } from '../utils/keys.js';

export class Tabby {
    constructor(model_name, url) {
        this.model_name = model_name;

        let config = {};
        if (url)
            config.baseURL = url;

        config.apiKey = getKey('TABBY_API_KEY');

        this.openai = new OpenAIApi(config);
        this.contextLengthHistory = [];
        this.responseTimeHistory = [];
        this.topContextLength = 0;
        this.topResponseTime = 0;
    }

    async sendRequest(turns, systemMessage, stop_seq='***') {
        let startSeconds = Math.floor(Date.now() / 1000);
        let messages = [{'role': 'system', 'content': systemMessage}].concat(turns);

        const pack = {
            model: this.model_name || "Meta-Llama-3-8B",
            messages,
            stop: stop_seq,
        };

        let res = null;
        try {
            // console.log(`--- Making TabbyAPI request:\n${JSON.stringify(messages)}`);
            console.log(`--> Making TabbyAPI request...`);
            let completion = await this.openai.chat.completions.create(pack);
            if (completion.choices[0].finish_reason == 'length')
                throw new Error('Context length exceeded'); 
            let durationSeconds = Math.floor(Date.now() / 1000) - startSeconds;
            this.responseTimeHistory.push(durationSeconds);
            if (durationSeconds > this.topResponseTime) {
                this.topResponseTime = durationSeconds;
            };
            var responseTimeSum = this.responseTimeHistory.reduce(function(accumulator, currentValue) {
                return accumulator + currentValue;
              }, 0);
            var avgResponseTime = (responseTimeSum / this.responseTimeHistory.length).toFixed(0);
            this.contextLengthHistory.push(completion.usage.total_tokens);
            if (completion.usage.total_tokens > this.topContextLength) {
                this.topContextLength = completion.usage.total_tokens;
            };
            var contextLengthSum = this.contextLengthHistory.reduce(function(accumulator, currentValue) {
                return accumulator + currentValue;
              }, 0);
            var avgContextLength = (contextLengthSum / this.contextLengthHistory.length).toFixed(0);
            console.log(`<-- Tabby response: "${completion.choices[0].message.content}"`);

            const green = '\x1b[32m';
            const reset = '\x1b[0m';
            console.log(`${green}||| Tabby stats ||| Response time: ${durationSeconds}s | Avg Response Time: ${avgResponseTime}s | Top Response Time: ${this.topResponseTime}s ||| Prompt Tokens: ${completion.usage.total_tokens} | Completion Tokens: ${completion.usage.completion_tokens} | Total Context: ${completion.usage.total_tokens} | Avg Context: ${avgContextLength} | Top Context: ${this.topContextLength} |||${reset}`);

            res = completion.choices[0].message.content;
        }
        catch (err) {
            if ((err.message == 'Context length exceeded' || err.code == 'context_length_exceeded') && turns.length > 1) {
                console.log('Context length exceeded, trying again with shorter context.');
                return await this.sendRequest(turns.slice(1), systemMessage, stop_seq);
            } else {
                console.log(err);
                res = 'My brain disconnected, try again.';
            }
        }
        return res;
    }

    async embed(text) {
        const embedding = await this.openai.embeddings.create({
            model: this.model_name || "text-embedding-3-large",
            input: text,
            encoding_format: "float",
        });
        return embedding.data[0].embedding;
    }
}



