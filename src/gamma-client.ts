/**
 * Gamma API Client
 * Direct integration with Gamma.app API v1.0
 */

export interface GammaGenerateParams {
  inputText: string;
  format?: 'presentation' | 'document' | 'webpage';
  numCards?: number;
  textMode?: 'generate' | 'summarize';
  textTone?: string;
  textAudience?: string;
  textAmount?: 'short' | 'medium' | 'long';
  textLanguage?: string;
  themeName?: string;
  imageModel?: string;
  imageStyle?: string;
  imageSource?: string;
  cardDimensions?: string;
  cardSplit?: string;
  additionalInstructions?: string;
  sharingExternalAccess?: string;
  sharingWorkspaceAccess?: string;
  exportAs?: string;
}

export interface GammaGenerateResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  title?: string;
  createdAt?: string;
  error?: string;
}

export interface GammaGetGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  title?: string;
  progress?: number;
  error?: string;
}

export class GammaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://public-api.gamma.app/v1.0') {
    if (!apiKey) {
      throw new Error('Gamma API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a new Gamma presentation/document
   */
  async generate(params: GammaGenerateParams): Promise<GammaGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_text: params.inputText,
        format: params.format || 'presentation',
        num_cards: params.numCards || 10,
        text_mode: params.textMode || 'generate',
        text_tone: params.textTone || 'professional',
        text_audience: params.textAudience || 'general',
        text_amount: params.textAmount || 'medium',
        text_language: params.textLanguage || 'Swedish',
        theme_name: params.themeName,
        image_model: params.imageModel,
        image_style: params.imageStyle,
        image_source: params.imageSource,
        card_dimensions: params.cardDimensions,
        card_split: params.cardSplit,
        additional_instructions: params.additionalInstructions,
        sharing_external_access: params.sharingExternalAccess,
        sharing_workspace_access: params.sharingWorkspaceAccess,
        export_as: params.exportAs,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as GammaGenerateResponse;
  }

  /**
   * Get the status of a generation job
   */
  async getGeneration(generationId: string): Promise<GammaGetGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as GammaGetGenerationResponse;
  }

  /**
   * List all generations (optional, if Gamma API supports it)
   */
  async listGenerations(limit: number = 10): Promise<GammaGetGenerationResponse[]> {
    const response = await fetch(`${this.baseUrl}/generations?limit=${limit}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;
    return (data.generations || data) as GammaGetGenerationResponse[];
  }
}
