import { LanguagePair, ModelId, SentenceSuggestion } from './types';

export type ApiConfig = {
  apiKey: string;
  apiUrl?: string;
  model?: string;
};

export interface AnalysisRequest {
  text: string;
  languagePair: LanguagePair;
  model: ModelId;
}

export interface AnalysisResult {
  suggestions: SentenceSuggestion[];
}

export class LanguageApi {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      ...config
    };
  }

  async analyzeText(request: AnalysisRequest): Promise<AnalysisResult> {
    const { text, languagePair, model } = request;
    
    // 根据模型选择合适的API配置
    const modelConfig = this.getModelConfig(model);
    
    const prompt = this.buildPrompt(text, languagePair);
    
    const response = await fetch(this.config.apiUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a language learning assistant that helps users improve their writing by providing better expressions and explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // 解析API返回的JSON格式结果
      const parsed = JSON.parse(content);
      return parsed as AnalysisResult;
    } catch (error) {
      console.error('Failed to parse API response:', content);
      throw new Error('Invalid response format from API');
    }
  }

  private getModelConfig(model: ModelId): { model: string } {
    switch (model) {
      case 'gpt':
        return { model: 'gpt-3.5-turbo' };
      case 'deepseek':
        // 对于DeepSeek，我们需要不同的API端点
        return { model: 'deepseek-chat' };
      default:
        return { model: 'gpt-3.5-turbo' };
    }
  }

  private buildPrompt(text: string, languagePair: LanguagePair): string {
    const languageNames: Record<LanguageCode, string> = {
      'zh': 'Chinese',
      'en': 'English', 
      'ko': 'Korean'
    };

    const fromLang = languageNames[languagePair.from];
    const toLang = languageNames[languagePair.to];

    return `
Please analyze the following text and provide improved expressions. The user is learning ${toLang} and wrote in ${fromLang}/${toLang}.

Input text: "${text}"

Analyze the text and return a JSON object with the following structure:
{
  "suggestions": [
    {
      "userInput": "original sentence",
      "rewritten": "improved version",
      "explanation": "brief explanation of the improvement",
      "focusPoints": ["key phrases that were improved"],
      "intentTags": ["tags describing the sentence purpose"],
      "timestamp": "ISO string"
    }
  ]
}

For each sentence:
1. If it's in ${fromLang}, translate to ${toLang} and suggest more natural expressions
2. If it's in mixed languages, explain the mixed parts and suggest ${toLang} alternatives
3. If it's in ${toLang} but not natural, provide more native-like expressions
4. If it's already good, provide alternative expressions and encouragement

Focus on naturalness, common expressions, and context-appropriate usage.`;
  }
}

type LanguageCode = 'zh' | 'en' | 'ko';