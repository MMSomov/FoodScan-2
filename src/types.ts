export interface DietaryFlag {
  profile: string;
  compatible: boolean;
  reason: string;
}

export interface IngredientAnalysis {
  name: string;
  status: 'safe' | 'caution' | 'hazardous';
  category: string;
  carcinogenicity: string;
  harmDetails: string;
  healthyAlternatives: string[];
}

export interface ProductSwap {
  name: string;
  description: string;
}

export interface AnalysisResult {
  productName: string;
  healthScore: number;
  overallSummary: string;
  allergens: string[];
  dietaryFlags: DietaryFlag[];
  ingredients: IngredientAnalysis[];
  generalSwaps: ProductSwap[];
}
