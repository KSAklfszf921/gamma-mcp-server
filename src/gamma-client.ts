/**
 * Gamma API Client
 * Complete integration with Gamma.app API v1.0
 * Based on official API documentation: https://developers.gamma.app
 */

// ========== TYPE DEFINITIONS ==========

export interface TextOptions {
  amount?: 'brief' | 'medium' | 'detailed' | 'extensive';
  tone?: string; // e.g., "professional, inspiring"
  audience?: string; // e.g., "tech investors and enthusiasts"
  language?: string; // e.g., "en", "sv"
}

export interface ImageOptions {
  source?: 'aiGenerated' | 'pictographic' | 'unsplash' | 'webAllImages' |
           'webFreeToUse' | 'webFreeToUseCommercially' | 'giphy' | 'placeholder' | 'noImages';
  model?: string; // e.g., "flux-1-pro", "imagen-4-pro"
  style?: string; // e.g., "photorealistic", "minimal lineart"
}

export interface CardHeaderFooterPosition {
  type: 'cardNumber' | 'image' | 'text';
  value?: string; // for type="text"
  source?: 'themeLogo' | 'custom'; // for type="image"
  src?: string; // for type="image" + source="custom"
  size?: 'sm' | 'md' | 'lg' | 'xl'; // for type="image"
}

export interface CardHeaderFooter {
  topLeft?: CardHeaderFooterPosition;
  topCenter?: CardHeaderFooterPosition;
  topRight?: CardHeaderFooterPosition;
  bottomLeft?: CardHeaderFooterPosition;
  bottomCenter?: CardHeaderFooterPosition;
  bottomRight?: CardHeaderFooterPosition;
  hideFromFirstCard?: boolean;
  hideFromLastCard?: boolean;
}

export interface CardOptions {
  dimensions?: 'fluid' | '16x9' | '4x3' | 'pageless' | 'letter' | 'a4' | '1x1' | '4x5' | '9x16';
  headerFooter?: CardHeaderFooter;
}

export interface EmailOptions {
  recipients?: string[];
  access?: 'view' | 'comment' | 'edit' | 'fullAccess';
}

export interface SharingOptions {
  workspaceAccess?: 'noAccess' | 'view' | 'comment' | 'edit' | 'fullAccess';
  externalAccess?: 'noAccess' | 'view' | 'comment' | 'edit';
  emailOptions?: EmailOptions;
}

// Generate API params
export interface GammaGenerateParams {
  inputText: string; // required
  textMode: 'generate' | 'condense' | 'preserve'; // required
  format?: 'presentation' | 'document' | 'webpage' | 'social';
  themeId?: string;
  numCards?: number; // 1-60 for Pro, 1-75 for Ultra
  cardSplit?: 'auto' | 'inputTextBreaks';
  additionalInstructions?: string;
  folderIds?: string[];
  exportAs?: 'pdf' | 'pptx';
  textOptions?: TextOptions;
  imageOptions?: ImageOptions;
  cardOptions?: CardOptions;
  sharingOptions?: SharingOptions;
}

// Create from Template API params
export interface GammaCreateFromTemplateParams {
  gammaId: string; // required
  prompt: string; // required
  themeId?: string;
  folderIds?: string[];
  exportAs?: 'pdf' | 'pptx';
  imageOptions?: {
    model?: string;
    style?: string;
  };
  sharingOptions?: SharingOptions;
}

// Response types
export interface GammaGenerateResponse {
  generationId: string;
  warnings?: string;
}

export interface GammaGenerationStatus {
  generationId: string;
  status: 'pending' | 'completed';
  gammaUrl?: string;
  credits?: {
    deducted: number;
    remaining: number;
  };
  pdfUrl?: string; // if exportAs="pdf"
  pptxUrl?: string; // if exportAs="pptx"
}

export interface Theme {
  id: string;
  name: string;
  type: 'standard' | 'custom';
  colorKeywords?: string[];
  toneKeywords?: string[];
}

export interface ThemesListResponse {
  data: Theme[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface Folder {
  id: string;
  name: string;
}

export interface FoldersListResponse {
  data: Folder[];
  hasMore: boolean;
  nextCursor: string | null;
}

// ========== GAMMA CLIENT ==========

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
   * Generate a new Gamma presentation/document/webpage
   * POST /v1.0/generations
   */
  async generate(params: GammaGenerateParams): Promise<GammaGenerateResponse> {
    const requestBody: any = {
      inputText: params.inputText,
      textMode: params.textMode,
    };

    // Optional top-level parameters
    if (params.format) requestBody.format = params.format;
    if (params.themeId) requestBody.themeId = params.themeId;
    if (params.numCards) requestBody.numCards = params.numCards;
    if (params.cardSplit) requestBody.cardSplit = params.cardSplit;
    if (params.additionalInstructions) requestBody.additionalInstructions = params.additionalInstructions;
    if (params.folderIds) requestBody.folderIds = params.folderIds;
    if (params.exportAs) requestBody.exportAs = params.exportAs;

    // Nested options
    if (params.textOptions) requestBody.textOptions = params.textOptions;
    if (params.imageOptions) requestBody.imageOptions = params.imageOptions;
    if (params.cardOptions) requestBody.cardOptions = params.cardOptions;
    if (params.sharingOptions) requestBody.sharingOptions = params.sharingOptions;

    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as GammaGenerateResponse;
  }

  /**
   * Create gamma from existing template
   * POST /v1.0/generations/from-template
   */
  async createFromTemplate(params: GammaCreateFromTemplateParams): Promise<GammaGenerateResponse> {
    const requestBody: any = {
      gammaId: params.gammaId,
      prompt: params.prompt,
    };

    if (params.themeId) requestBody.themeId = params.themeId;
    if (params.folderIds) requestBody.folderIds = params.folderIds;
    if (params.exportAs) requestBody.exportAs = params.exportAs;
    if (params.imageOptions) requestBody.imageOptions = params.imageOptions;
    if (params.sharingOptions) requestBody.sharingOptions = params.sharingOptions;

    const response = await fetch(`${this.baseUrl}/generations/from-template`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as GammaGenerateResponse;
  }

  /**
   * Get the status of a generation job
   * GET /v1.0/generations/{generationId}
   */
  async getGeneration(generationId: string): Promise<GammaGenerationStatus> {
    const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as GammaGenerationStatus;
  }

  /**
   * List themes available in workspace
   * GET /v1.0/themes
   */
  async listThemes(options?: {
    query?: string;
    limit?: number;
    after?: string;
  }): Promise<ThemesListResponse> {
    const params = new URLSearchParams();
    if (options?.query) params.append('query', options.query);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);

    const url = `${this.baseUrl}/themes${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as ThemesListResponse;
  }

  /**
   * List folders in workspace
   * GET /v1.0/folders
   */
  async listFolders(options?: {
    query?: string;
    limit?: number;
    after?: string;
  }): Promise<FoldersListResponse> {
    const params = new URLSearchParams();
    if (options?.query) params.append('query', options.query);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);

    const url = `${this.baseUrl}/folders${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    return await response.json() as FoldersListResponse;
  }
}
