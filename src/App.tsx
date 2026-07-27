import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Apple, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Video,
  X,
  RefreshCw,
  TrendingDown,
  Activity,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult, IngredientAnalysis, DietaryFlag, ProductSwap } from './types';

// PRESET DATA WITH PRE-COMPUTED HIGH-QUALITY ANALYSES FOR FASTER RESPONSES AND SAFETY FALLBACKS
const PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  ingredientsText: string;
  mockResult: AnalysisResult;
}> = [
  {
    id: 'cheetos',
    name: "Flamin' Hot Crunchy Cheetos",
    description: "Extruded cornmeal snack coated with artificial red spicy seasoning.",
    category: "Salty Snack",
    ingredientsText: "Enriched Corn Meal (Corn Meal, Ferrous Sulfate, Niacin, Thiamin Mononitrate, Riboflavin, Folic Acid), Vegetable Oil (Corn, Canola, and/or Sunflower Oil), Flamin' Hot Seasoning (Maltodextrin [Made from Corn], Salt, Sugar, Monosodium Glutamate, Yeast Extract, Citric Acid, Artificial Color [Red 40 Lake, Yellow 6 Lake, Yellow 6, Yellow 5], Sunflower Oil, Cheddar Cheese [Milk, Cheese Cultures, Salt, Enzymes], Onion Powder, Whey, Whey Protein Concentrate, Garlic Powder, Natural Flavor, Buttermilk, Sodium Diacetate, Disodium Inosinate, Disodium Guanylate), Salt.",
    mockResult: {
      productName: "Flamin' Hot Crunchy Cheetos",
      healthScore: 18,
      overallSummary: "This product is an ultra-processed snack with extremely low nutritional value. It contains high-fructose components, artificial food dyes linked to behavioral issues, and flavor enhancers like MSG. It represents significant nutritional harm if consumed regularly.",
      allergens: ["Dairy", "Milk", "Corn", "Gluten (Cross-contact risk)"],
      dietaryFlags: [
        { profile: "Vegan", compatible: false, reason: "Contains Cheddar Cheese, Whey, Whey Protein Concentrate, and Buttermilk." },
        { profile: "Vegetarian", compatible: true, reason: "Does not contain direct meat, but uses dairy ingredients." },
        { profile: "Gluten-Free", compatible: true, reason: "Ingredients do not contain wheat, but processed in facilities with potential cross-contact." },
        { profile: "Dairy-Free", compatible: false, reason: "Contains multiple milk derivatives (whey, cheese, buttermilk)." },
        { profile: "Keto", compatible: false, reason: "Main ingredient is corn meal, which is highly glycemic and loaded with simple carbs." }
      ],
      ingredients: [
        {
          name: "Enriched Corn Meal",
          status: "caution",
          category: "Refined Grain",
          carcinogenicity: "None",
          harmDetails: "Refined carbohydrate stripped of its natural fiber, causing rapid spikes in blood glucose and insulin levels.",
          healthyAlternatives: ["Sprouted whole grains", "Quinoa flour", "Lentil flour"]
        },
        {
          name: "Monosodium Glutamate (MSG)",
          status: "caution",
          category: "Flavor Enhancer",
          carcinogenicity: "None",
          harmDetails: "Excitotoxin that can overstimulate neurotransmitters; triggers headaches, brain fog, and mild allergic responses in sensitive individuals.",
          healthyAlternatives: ["Nutritional yeast", "Sea salt", "Garlic powder", "Onion powder"]
        },
        {
          name: "Red 40 Lake & Yellow 6 Lake",
          status: "hazardous",
          category: "Synthetic Dye",
          carcinogenicity: "Suspected (Linked to cancer in animal trials; contains benzidine, a known carcinogen).",
          harmDetails: "Associated with hyperactivity and ADHD in children. Banned or heavily restricted in the European Union due to neurotoxicity concerns.",
          healthyAlternatives: ["Beet juice extract", "Paprika oleoresin", "Turmeric extract", "Annatte extract"]
        },
        {
          name: "Disodium Inosinate & Disodium Guanylate",
          status: "caution",
          category: "Flavor Enhancer",
          carcinogenicity: "None",
          harmDetails: "Chemical flavor enhancers used alongside MSG to multiply savory taste. Can trigger gout flare-ups due to purine concentration.",
          healthyAlternatives: ["Mushroom powder", "Natural sea salt", "Tomato paste"]
        },
        {
          name: "Vegetable Oil (Corn/Canola/Sunflower)",
          status: "caution",
          category: "Refined Fats",
          carcinogenicity: "Possible (If heated past smoke point, forms highly carcinogenic polar compounds and acrylamide).",
          harmDetails: "Highly refined, oxidized solvent-extracted oils high in Omega-6 fatty acids, contributing to chronic systemic inflammation.",
          healthyAlternatives: ["Cold-pressed avocado oil", "Extra virgin olive oil", "Coconut oil"]
        }
      ],
      generalSwaps: [
        { name: "Siete Grain-Free Spicy Blanco Chips", description: "Made with avocado oil and ground cassava flour, spiced naturally without artificial colors." },
        { name: "LesserEvil Fiery Hot Organic Popcorn", description: "Air-popped organic corn with coconut oil, naturally seasoned for a clean, spicy crunch." }
      ]
    }
  },
  {
    id: 'diet-soda',
    name: "Diet Cola Soda",
    description: "Zero-calorie carbonated soft drink sweetened with aspartame.",
    category: "Beverage",
    ingredientsText: "Carbonated Water, Caramel Color, Aspartame, Phosphoric Acid, Potassium Benzoate, Natural Flavors, Citric Acid, Caffeine.",
    mockResult: {
      productName: "Diet Cola Soda",
      healthScore: 25,
      overallSummary: "Though calorie-free, this beverage relies on controversial artificial sweeteners and harsh chemical acids. It poses significant risks to gut microbiomes, renal health, and enamel integrity, and has suspected carcinogenicity profiles from caramel coloring and synthetic sweeteners.",
      allergens: ["None"],
      dietaryFlags: [
        { profile: "Vegan", compatible: true, reason: "Contains no animal products." },
        { profile: "Vegetarian", compatible: true, reason: "Contains no meat or animal tissue." },
        { profile: "Gluten-Free", compatible: true, reason: "Free from gluten-based grains." },
        { profile: "Dairy-Free", compatible: true, reason: "Contains no dairy ingredients." },
        { profile: "Keto", compatible: true, reason: "Zero carbohydrates, though artificial sweeteners may trigger cephalic insulin response." }
      ],
      ingredients: [
        {
          name: "Aspartame",
          status: "hazardous",
          category: "Artificial Sweetener",
          carcinogenicity: "Classified Group 2B (Possibly carcinogenic to humans by WHO/IARC as of July 2023).",
          harmDetails: "Linked to glucose intolerance, gut microbiome alteration, and headaches. May trigger sweet-cravings by disrupting metabolic pathways.",
          healthyAlternatives: ["Stevia leaf extract", "Monk fruit extract", "Erythritol (in moderation)"]
        },
        {
          name: "Caramel Color (Class IV)",
          status: "hazardous",
          category: "Artificial Coloring",
          carcinogenicity: "Suspected (Contains 4-MEI [4-methylimidazole], which is classified as possibly carcinogenic to humans by California's Prop 65).",
          harmDetails: "Synthesized by reacting sugars with ammonium and sulfite compounds under high pressure. Can impact immune system function.",
          healthyAlternatives: ["Roasted barley extract", "Blackberry juice juice", "None (clear sodas)"]
        },
        {
          name: "Phosphoric Acid",
          status: "caution",
          category: "Acidulant",
          carcinogenicity: "None",
          harmDetails: "Highly acidic. Dissolves tooth enamel and leaches calcium from bones, which can increase risk of osteoporosis with heavy consumption.",
          healthyAlternatives: ["Citric acid", "Apple cider vinegar", "Lemon juice"]
        },
        {
          name: "Potassium Benzoate",
          status: "caution",
          category: "Chemical Preservative",
          carcinogenicity: "Possible (Can react with Ascorbic Acid/Vitamin C in sodas under heat/light to synthesize Benzene, a known human carcinogen).",
          harmDetails: "Can cause DNA damage in mitochondria and trigger allergic responses or hyperactivity.",
          healthyAlternatives: ["Rosemary extract", "Vitamin E (Tocopherols)", "Natural fermentation"]
        }
      ],
      generalSwaps: [
        { name: "Olipop Vintage Cola", description: "A prebiotic soda containing plant fibers and botanicals with only 2-3g of natural sugar and zero artificial sweeteners." },
        { name: "Spindrift No-Sugar Sparkling Water", description: "Real carbonated water squeezed with real organic fruit juice for natural, ultra-low calorie refreshment." }
      ]
    }
  },
  {
    id: 'ramen',
    name: "Instant Chicken Ramen Noodles",
    description: "Dehydrated block of instant noodles with chemical chicken seasoning.",
    category: "Instant Meal",
    ingredientsText: "Enriched Flour (Wheat Flour, Niacin, Reduced Iron, Thiamine Mononitrate, Riboflavin, Folic Acid), Vegetable Oil (Palm Oil, Rice Bran Oil, Sesame Oil), Salt, Contains Less than 2% of Maltodextrin, Monosodium Glutamate, Textured Soy Protein, Hydrolyzed Corn, Wheat and Soy Protein, Sugar, Dehydrated Vegetables (Garlic, Onion, Chive), Spices, Soy Sauce, Caramel Color, Disodium Guanylate, Disodium Inosinate, Potassium Carbonate, Sodium Carbonate, Sodium Tripolyphosphate, Natural Flavor.",
    mockResult: {
      productName: "Instant Chicken Ramen Noodles",
      healthScore: 32,
      overallSummary: "This product is exceptionally high in refined sodium, processed palm fats, and multiple flavor enhancers. Regular intake exposes the cardiovascular system to severe stress and is highly inflammatory due to heavily processed oils.",
      allergens: ["Wheat", "Gluten", "Soy", "Sesame"],
      dietaryFlags: [
        { profile: "Vegan", compatible: false, reason: "Seasoning packet contains hydrolyzed proteins and artificial flavorings derived from animal/chicken fats." },
        { profile: "Vegetarian", compatible: false, reason: "Contains chicken fat/flavorings in standard recipes." },
        { profile: "Gluten-Free", compatible: false, reason: "Noodles are made primarily of wheat flour." },
        { profile: "Dairy-Free", compatible: true, reason: "Does not contain milk derivatives." }
      ],
      ingredients: [
        {
          name: "Sodium Tripolyphosphate (STPP)",
          status: "caution",
          category: "Emulsifier/Moisture Retainer",
          carcinogenicity: "None",
          harmDetails: "An inorganic phosphate compound. Excessive dietary phosphates are linked to accelerated vascular aging, cardiovascular damage, and chronic kidney disease.",
          healthyAlternatives: ["Traditional hand-pulled drying", "No chemical binders"]
        },
        {
          name: "Palm Oil (Refined)",
          status: "caution",
          category: "Processed Fat",
          carcinogenicity: "Suspected (Refining palm oil at high temperatures >200°C produces glycidyl fatty acid esters, which are genotoxic and carcinogenic).",
          harmDetails: "Extremely high in saturated fats that can elevate LDL cholesterol. Strongly associated with negative ecological impact and high arterial inflammation.",
          healthyAlternatives: ["Cold-pressed sesame oil", "Avocado oil", "Organic coconut fat"]
        },
        {
          name: "Monosodium Glutamate (MSG)",
          status: "caution",
          category: "Flavor Enhancer",
          carcinogenicity: "None",
          harmDetails: "Heavily concentrated flavor chemical designed to trigger continuous eating behavior. Can increase blood pressure when combined with high sodium.",
          healthyAlternatives: ["Shiitake mushroom extract", "Kombu seaweed powder", "Bone broth"]
        },
        {
          name: "Hydrolyzed Soy/Corn Protein",
          status: "caution",
          category: "Flavor Enhancer",
          carcinogenicity: "None",
          harmDetails: "Processed plant proteins chemically broken down into free amino acids (acting like natural MSG). Usually derived from GMO crops treated with heavy glyphosate.",
          healthyAlternatives: ["Organic brewer's yeast", "Pea protein isolate"]
        }
      ],
      generalSwaps: [
        { name: "Public Goods Organic Ramen Noodles", description: "Ramen noodles that are baked, never fried, using organic ingredients and a MSG-free seasoning mix." },
        { name: "Lotus Foods Organic Millet & Brown Rice Ramen", description: "Gluten-free organic rice noodles packed with whole fiber, which cooks instantly in organic vegetable or bone broth." }
      ]
    }
  },
  {
    id: 'almond-butter',
    name: "Organic Dry Roasted Almond Butter",
    description: "A clean, natural nut spread containing only organic almonds and salt.",
    category: "Nut Butter",
    ingredientsText: "Organic Dry Roasted Almonds, Sea Salt.",
    mockResult: {
      productName: "Organic Dry Roasted Almond Butter",
      healthScore: 98,
      overallSummary: "This is a pristine, whole-food product. It contains zero preservatives, zero added seed oils, zero artificial sweeteners, and zero synthetic dyes. It provides dense fiber, healthy monounsaturated fats, and plant protein in its natural state.",
      allergens: ["Almonds (Tree Nuts)"],
      dietaryFlags: [
        { profile: "Vegan", compatible: true, reason: "100% plant-based." },
        { profile: "Vegetarian", compatible: true, reason: "Contains only nuts and sea salt." },
        { profile: "Gluten-Free", compatible: true, reason: "Naturally gluten-free grain-free product." },
        { profile: "Dairy-Free", compatible: true, reason: "Contains no milk, whey, or dairy." },
        { profile: "Keto", compatible: true, reason: "High fat, moderate protein, very low net-carbs due to high fiber content." }
      ],
      ingredients: [
        {
          name: "Organic Dry Roasted Almonds",
          status: "safe",
          category: "Whole Food / Nut",
          carcinogenicity: "None (Contains Vitamin E which actively fights free radicals and reduces cancer risk).",
          harmDetails: "Packed with magnesium, copper, dietary fiber, and healthy monounsaturated fatty acids. Promotes cardiovascular health and stable insulin levels.",
          healthyAlternatives: ["None needed. This is a top-tier premium source of nutrition."]
        },
        {
          name: "Sea Salt",
          status: "safe",
          category: "Mineral",
          carcinogenicity: "None",
          harmDetails: "Unrefined mineral seasoning providing sodium and trace elements. Safe in standard quantities, though sodium should be monitored for hypertension.",
          healthyAlternatives: ["Pink Himalayan salt", "Celtic sea salt"]
        }
      ],
      generalSwaps: [
        { name: "Raw Organic Almonds (Home blended)", description: "Blend raw, unroasted almonds for an even lower thermal-oxidized oil profile and maximum raw enzymes." }
      ]
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'text'>('upload');
  
  // Custom states
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User Profile Dietary Toggles
  const [userDiets, setUserDiets] = useState<Record<string, boolean>>({
    "Vegan": false,
    "Vegetarian": false,
    "Gluten-Free": false,
    "Dairy-Free": false,
    "Keto": false
  });
  
  // User Allergies Toggles
  const [userAllergies, setUserAllergies] = useState<Record<string, boolean>>({
    "Dairy": false,
    "Wheat": false,
    "Soy": false,
    "Peanuts": false,
    "Tree Nuts": false,
    "Gluten": false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Handle active tab switches cleanly
  const handleTabChange = (tab: 'upload' | 'camera' | 'text') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab !== 'camera') {
      stopCamera();
    }
  };

  // Start web camera
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      if (mediaStreamRef.current) {
        stopCamera();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera Access Error:", err);
      setCameraError("Unable to access camera. Please allow camera permissions or upload an image instead.");
      setCameraActive(false);
    }
  };

  // Capture image frame from video feed
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewUrl(dataUrl);
      stopCamera();
    }
  };

  // Drag and drop / Manual file upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Reset analysis results to scan again
  const handleReset = () => {
    setAnalysisResult(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setInputText('');
    setErrorMessage(null);
    stopCamera();
  };

  // Submit analysis request to server
  const runAnalysis = async (customPayload?: { text?: string; image?: string }) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStatus("Initializing scanners...");

    const statusUpdates = [
      "Uploading and extracting text labels...",
      "Analyzing molecular food compounds with Gemini-3.6...",
      "Matching found allergens against clinical index...",
      "Evaluating toxicological hazards and carcinogenicity...",
      "Sourcing healthy non-toxic organic alternatives...",
      "Compiling final nutritionist metrics..."
    ];

    let currentStatusIdx = 0;
    const statusInterval = setInterval(() => {
      if (currentStatusIdx < statusUpdates.length - 1) {
        currentStatusIdx++;
        setAnalysisStatus(statusUpdates[currentStatusIdx]);
      }
    }, 1800);

    try {
      let body: Record<string, any> = {};

      if (customPayload) {
        body = customPayload;
      } else if (activeTab === 'text') {
        if (!inputText.trim()) {
          throw new Error("Please write or paste an ingredient list to analyze.");
        }
        body = { text: inputText };
      } else if (previewUrl) {
        body = { 
          image: previewUrl, 
          mimeType: previewUrl.split(';')[0].split(':')[1] || 'image/jpeg' 
        };
      } else {
        throw new Error("Please upload an image, snap a label photo, or enter ingredients list text first.");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}. Please check your Gemini secrets.`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during analysis. Please check your network connection or Gemini API settings.");
    } finally {
      clearInterval(statusInterval);
      setIsAnalyzing(false);
    }
  };

  // Choose a preset instantly
  const handleSelectPreset = async (preset: typeof PRESETS[0]) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setInputText(preset.ingredientsText);

    // Play a fast visual loading sequence
    setAnalysisStatus("Loading cached expert analysis for preset...");
    
    setTimeout(() => {
      setAnalysisResult(preset.mockResult);
      setIsAnalyzing(false);
    }, 900);
  };

  // Score color-coding
  const getScoreColor = (score: number) => {
    if (score >= 70) return { text: 'text-emerald-700', bg: 'bg-emerald-500', border: 'border-emerald-300', textLight: 'text-emerald-800', bgLight: 'bg-emerald-50/70', badgeClass: 'editorial-tag-safe' };
    if (score >= 40) return { text: 'text-amber-800', bg: 'bg-amber-500', border: 'border-amber-300', textLight: 'text-amber-800', bgLight: 'bg-amber-50/70', badgeClass: 'editorial-tag-warning' };
    return { text: 'text-red-700', bg: 'bg-red-500', border: 'border-red-300', textLight: 'text-red-800', bgLight: 'bg-red-50/70', badgeClass: 'editorial-tag-danger' };
  };

  const scoreTheme = analysisResult ? getScoreColor(analysisResult.healthScore) : null;

  // Real-time diet/allergen check against current results
  const checkDietMatch = (profileName: string): { compatible: boolean; reason: string } | null => {
    if (!analysisResult) return null;
    const foundFlag = analysisResult.dietaryFlags.find(
      f => f.profile.toLowerCase() === profileName.toLowerCase()
    );
    return foundFlag || { compatible: true, reason: "No warnings found for this lifestyle diet." };
  };

  const isAllergenMatched = (allergenName: string): boolean => {
    if (!analysisResult) return false;
    return analysisResult.allergens.some(
      a => a.toLowerCase().includes(allergenName.toLowerCase()) || 
           allergenName.toLowerCase().includes(a.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen text-stone-900 bg-[#F9F7F2] font-sans antialiased pb-20">
      {/* HEADER SECTION (EDITORIAL STYLE) */}
      <header className="sticky top-0 z-40 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-black/15 py-5 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-1.5">
              Lab Analysis Platform
            </span>
            <div className="flex items-baseline space-x-3.5">
              <h1 className="editorial-heading text-3xl md:text-4xl italic font-light text-stone-950">
                Food scan
              </h1>
              <div className="hidden sm:block h-3 w-px bg-stone-300 self-center" />
              <span className="text-xs font-serif italic text-stone-500 tracking-wide">
                Food Label Integrity & Carcinogen Reporter
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center text-[10px] uppercase tracking-[0.1em] text-stone-700 bg-white border border-stone-200 px-3 py-1.5 rounded-sm font-bold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#D43F3F]" />
              Gemini 3.6 Evaluation
            </span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: INPUT ZONE */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* SCANNER CONSOLE */}
            <div className="editorial-card p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-baseline mb-4">
                <h2 className="editorial-heading text-xl italic font-light text-stone-900 flex items-center">
                  Label Scanner Console
                </h2>
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                  Device Ingress
                </span>
              </div>
              <div className="rule-line mb-6" />

              {/* INPUT TABS */}
              <div className="flex border-b border-black/10 mb-6 font-serif">
                <button
                  id="tab-upload"
                  onClick={() => handleTabChange('upload')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-3 border-b-2 text-xs md:text-sm italic font-medium transition-all ${
                    activeTab === 'upload' 
                      ? 'border-black text-stone-950 font-bold' 
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Label</span>
                </button>
                <button
                  id="tab-camera"
                  onClick={() => handleTabChange('camera')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-3 border-b-2 text-xs md:text-sm italic font-medium transition-all ${
                    activeTab === 'camera' 
                      ? 'border-black text-stone-950 font-bold' 
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Scan</span>
                </button>
                <button
                  id="tab-text"
                  onClick={() => handleTabChange('text')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-3 border-b-2 text-xs md:text-sm italic font-medium transition-all ${
                    activeTab === 'text' 
                      ? 'border-black text-stone-950 font-bold' 
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* TAB CONSOLE VIEWPORT */}
              <div className="min-h-[220px] flex flex-col justify-center">
                
                {/* 1. UPLOAD VIEW */}
                {activeTab === 'upload' && (
                  <div
                    id="dropzone"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all rounded-sm ${
                      previewUrl 
                        ? 'border-stone-400 bg-white/50' 
                        : 'border-stone-300 hover:border-black hover:bg-stone-100/40'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    {previewUrl ? (
                      <div className="space-y-4 w-full text-center">
                        <img 
                          src={previewUrl} 
                          alt="Ingredient label preview" 
                          className="max-h-48 mx-auto rounded-sm object-contain shadow-sm border border-stone-200"
                        />
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-150 px-2 py-1 rounded-sm uppercase tracking-wider">
                            {selectedFile ? selectedFile.name : "Captured Photo"}
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset();
                            }}
                            className="p-1 rounded-sm bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="inline-flex p-3 bg-stone-100/80 border border-stone-200 rounded-sm text-stone-500">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-800">Drag & drop your label here</p>
                          <p className="text-xs text-stone-400 mt-1">Supports PNG, JPG, or WEBP up to 10MB</p>
                        </div>
                        <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-stone-800 hover:text-black bg-stone-200/50 hover:bg-stone-250 border border-stone-300 px-3 py-1.5 rounded-sm transition-colors">
                          Browse files
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CAMERA VIEW */}
                {activeTab === 'camera' && (
                  <div className="w-full flex flex-col items-center">
                    {previewUrl ? (
                      <div className="space-y-4 w-full text-center">
                        <img 
                          src={previewUrl} 
                          alt="Captured label" 
                          className="max-h-48 mx-auto rounded-sm object-contain shadow-sm border border-stone-200"
                        />
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-200 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                            Captured Label Frame
                          </span>
                          <button 
                            type="button"
                            onClick={handleReset}
                            className="p-1 rounded-sm bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 hover:text-stone-900 bg-stone-200/50 px-3 py-1.5 border border-stone-300 rounded-sm transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Photo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full relative bg-stone-950 rounded-sm overflow-hidden min-h-[220px] flex items-center justify-center border border-black/10">
                        {cameraActive ? (
                          <>
                            <video 
                              ref={videoRef} 
                              playsInline 
                              muted 
                              className="w-full h-56 object-cover"
                            />
                            {/* VINTAGE SCANNER OVERLAY EFFECT */}
                            <div className="absolute inset-0 border border-[#D43F3F]/30 pointer-events-none" />
                            <div className="absolute top-1/3 left-10 right-10 h-1 bg-[#D43F3F]/45 shadow-sm animate-pulse" />
                            
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 px-4">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="bg-stone-900 hover:bg-black border border-black text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-sm shadow-md transition-colors"
                              >
                                Capture Label
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="bg-stone-700 hover:bg-stone-800 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-4">
                            <div className="inline-flex p-3 bg-stone-900 text-white rounded-sm">
                              <Video className="w-5 h-5" />
                            </div>
                            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Label optical scan</p>
                            {cameraError && (
                              <p className="text-xs text-rose-400 max-w-sm px-4">{cameraError}</p>
                            )}
                            <button
                              type="button"
                              onClick={startCamera}
                              className="bg-stone-900 hover:bg-black border border-black text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm shadow-md transition-colors"
                            >
                              Activate Camera
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {/* 3. TEXT VIEW */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <label htmlFor="ingredient-textarea" className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Ingredients List Input
                    </label>
                    <textarea
                      id="ingredient-textarea"
                      rows={5}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste ingredient label text (e.g. Enriched Flour, Sugar, Yellow 5 Dye, Hydrogenated Soybean Oil...)"
                      className="w-full p-4 text-xs font-serif rounded-sm border border-stone-200 focus:border-stone-400 bg-white/60 outline-none transition-all"
                    />
                  </div>
                )}

              </div>

              {/* ACTION BUTTON */}
              <div className="mt-6 pt-4 border-t border-black/10">
                <button
                  id="btn-analyze"
                  onClick={() => runAnalysis()}
                  disabled={isAnalyzing || (activeTab === 'text' ? !inputText.trim() : !previewUrl)}
                  className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-all ${
                    isAnalyzing || (activeTab === 'text' ? !inputText.trim() : !previewUrl)
                      ? 'bg-stone-200 text-stone-450 cursor-not-allowed border border-stone-300'
                      : 'bg-stone-950 hover:bg-black text-white border border-black shadow-md active:scale-[0.99]'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                      <span>{analysisStatus}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      <span>Analyze Ingredient Safety</span>
                    </>
                  )}
                </button>
                {errorMessage && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-xs text-rose-850 font-semibold flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D43F3F]" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PRESETS PANEL */}
            <div className="editorial-card p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-baseline mb-3">
                <h3 className="editorial-heading text-lg italic font-light text-stone-900">
                  Reference Label Files
                </h3>
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                  Preset Library
                </span>
              </div>
              <div className="rule-line mb-4" />
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                Click any preset file below to instantly compile real-time nutritional diagnostics and toxicological profiles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRESETS.map((preset) => {
                  const isSelected = analysisResult?.productName === preset.name;
                  return (
                    <button
                      id={`preset-${preset.id}`}
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-4 rounded-sm border transition-all relative flex flex-col justify-between ${
                        isSelected 
                          ? 'border-black bg-white ring-1 ring-black/10' 
                          : 'border-stone-200 hover:border-stone-400 bg-white/40 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-serif italic text-sm text-stone-950 line-clamp-1">{preset.name}</div>
                        <div className="text-[9px] text-stone-450 mt-1 uppercase font-bold tracking-wider">{preset.category}</div>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-2 line-clamp-2 leading-relaxed font-normal">{preset.description}</div>
                      {isSelected && (
                        <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-[#D43F3F] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIETARY & ALLERGEN FILTERS */}
            <div className="editorial-card p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-baseline mb-3">
                <h3 className="editorial-heading text-lg italic font-light text-stone-900">
                  Safety Profiler Settings
                </h3>
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                  Patient Filters
                </span>
              </div>
              <div className="rule-line mb-4" />
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                Set active dietary requirements and severe food allergies. Potential conflicts will instantly highlight on reports.
              </p>

              {/* DIETARY LIFESTYLES */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2.5">
                    1. Dietary Mandates
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(userDiets).map((diet) => (
                      <button
                        id={`toggle-diet-${diet}`}
                        key={diet}
                        type="button"
                        onClick={() => setUserDiets(prev => ({ ...prev, [diet]: !prev[diet] }))}
                        className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                          userDiets[diet]
                            ? 'bg-stone-950 border-stone-950 text-white shadow-sm'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ALLERGIES */}
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2.5">
                    2. Active Severe Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(userAllergies).map((allergen) => (
                      <button
                        id={`toggle-allergen-${allergen}`}
                        key={allergen}
                        type="button"
                        onClick={() => setUserAllergies(prev => ({ ...prev, [allergen]: !prev[allergen] }))}
                        className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                          userAllergies[allergen]
                            ? 'bg-[#D43F3F] border-[#D43F3F] text-white shadow-sm'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: REPORT ZONE */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                /* LOADING PANEL (EDITORIAL SPIN) */
                <motion.div
                  id="analysis-loader"
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="editorial-card p-8 text-center min-h-[500px] flex flex-col items-center justify-center space-y-6 bg-white/70 shadow-sm"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border border-stone-300 border-t-stone-950 animate-spin" />
                    <Apple className="w-4 h-4 text-stone-900 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
                      Report Formulation No. 3492
                    </span>
                    <h3 className="editorial-heading text-2xl italic font-light text-stone-900">
                      Compiling Integrity Dossier...
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                      {analysisStatus}
                    </p>
                  </div>
                  <div className="max-w-xs w-full bg-stone-200/50 h-px rounded-full overflow-hidden">
                    <div className="bg-stone-900 h-full animate-[loading_8s_ease-in-out_infinite]" style={{ width: '60%' }} />
                  </div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest italic font-bold">
                    Bio-Additive Analysis Engine Active
                  </p>
                </motion.div>
              ) : analysisResult ? (
                /* ANALYSIS REPORT VIEW */
                <motion.div
                  id="analysis-report"
                  key="report"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-8"
                >
                  {/* OVERVIEW HERO BOX */}
                  <div className="editorial-card p-6 md:p-8 shadow-md relative overflow-hidden bg-white">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                      
                      <div className="space-y-4 flex-1">
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 block mb-1">
                            Integrity Dossier
                          </span>
                          <h2 className="editorial-heading text-3xl font-light italic text-stone-950 leading-tight">
                            {analysisResult.productName}
                          </h2>
                        </div>
                        
                        <div className="rule-line" />
                        
                        <p className="text-xs leading-relaxed text-stone-600 font-serif italic pr-4">
                          {analysisResult.overallSummary}
                        </p>
                      </div>

                      {/* VINTAGE HEALTH SCORE GAUGE */}
                      <div className="flex flex-col items-center text-center self-center md:self-start flex-shrink-0">
                        <div className={`w-28 h-28 rounded-full border border-black/10 flex flex-col items-center justify-center shadow-inner ${scoreTheme?.bgLight}`}>
                          <span className="text-[9px] uppercase tracking-[0.15em] text-stone-400 font-bold mb-1">Health Score</span>
                          <span className="text-4xl font-serif text-stone-950 leading-none">
                            {analysisResult.healthScore}
                          </span>
                          <span className="text-[9px] text-stone-400 mt-1 font-bold">/ 100</span>
                        </div>
                        <div className="mt-3">
                          {analysisResult.healthScore >= 70 ? (
                            <span className="editorial-tag editorial-tag-safe">
                              Pristine
                            </span>
                          ) : analysisResult.healthScore >= 40 ? (
                            <span className="editorial-tag editorial-tag-warning">
                              Cautionary
                            </span>
                          ) : (
                            <span className="editorial-tag editorial-tag-danger animate-pulse">
                              Hazardous
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ALLERGEN TRIGGER BAR */}
                  <div className="editorial-card p-6 md:p-8 shadow-sm">
                    <div className="flex justify-between items-baseline mb-3">
                      <h3 className="editorial-heading text-lg italic font-light text-stone-900">
                        Allergen Safety Analysis
                      </h3>
                      <span className="text-[9px] uppercase tracking-widest text-[#D43F3F] font-bold">
                        Immunology Report
                      </span>
                    </div>
                    <div className="rule-line mb-5" />
                    
                    {/* ACTIVE ALLERGY WARNING */}
                    {Object.entries(userAllergies).some(([all, val]) => val && isAllergenMatched(all)) ? (
                      <div className="mb-5 p-4 bg-red-50 border border-[#D43F3F]/30 text-red-850 rounded-sm text-xs font-bold flex items-center space-x-2 animate-pulse">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#D43F3F]" />
                        <span>ALLERGEN DISCOVERED: Product formulation contains components incompatible with your severe {Object.entries(userAllergies).filter(([all, val]) => val && isAllergenMatched(all)).map(([all]) => all).join(', ')} allergy profile.</span>
                      </div>
                    ) : null}

                    {analysisResult.allergens.length > 0 && analysisResult.allergens[0] !== "None" ? (
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.allergens.map((allergen, i) => {
                          const isUserAllergen = userAllergies[allergen as any] || isAllergenMatched(allergen);
                          return (
                            <span 
                              key={i} 
                              className={`editorial-tag inline-flex items-center ${
                                isUserAllergen 
                                  ? 'editorial-tag-danger border-red-300' 
                                  : 'bg-white border border-stone-200 text-stone-700'
                              }`}
                            >
                              <AlertTriangle className={`w-3.5 h-3.5 mr-1.5 ${isUserAllergen ? 'text-[#D43F3F]' : 'text-stone-400'}`} />
                              {allergen}
                              {isUserAllergen && <span className="ml-1.5 text-[8px] font-bold opacity-85">(Severe Risk)</span>}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-100 text-stone-800 rounded-sm text-xs font-serif italic flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>No severe clinical food allergens detected inside the ingredient formulation.</span>
                      </div>
                    )}
                  </div>

                  {/* DIETARY LIFESTYLE MATCH MATRIX */}
                  <div className="editorial-card p-6 md:p-8 shadow-sm">
                    <div className="flex justify-between items-baseline mb-3">
                      <h3 className="editorial-heading text-lg italic font-light text-stone-900">
                        Dietary Compatibility Report
                      </h3>
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                        Nutritional Profile
                      </span>
                    </div>
                    <div className="rule-line mb-5" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {analysisResult.dietaryFlags.map((flag, idx) => {
                        const isUserDietEnabled = userDiets[flag.profile as any];
                        return (
                          <div 
                            key={idx}
                            className={`p-4 rounded-sm border flex flex-col justify-between space-y-3 transition-all ${
                              isUserDietEnabled 
                                ? flag.compatible 
                                  ? 'bg-emerald-50/20 border-emerald-300 shadow-sm'
                                  : 'bg-red-50/25 border-[#D43F3F]/30 shadow-sm'
                                : 'bg-white/40 border-stone-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs uppercase tracking-wider text-stone-800">{flag.profile}</span>
                              {flag.compatible ? (
                                <span className="text-emerald-700">
                                  <CheckCircle className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="text-[#D43F3F]">
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 leading-relaxed font-normal">
                              {flag.reason}
                            </p>
                            {isUserDietEnabled && (
                              <span className={`text-[8px] font-bold tracking-widest uppercase text-center py-1 rounded-sm ${
                                flag.compatible ? 'editorial-tag-safe' : 'editorial-tag-danger'
                              }`}>
                                {flag.compatible ? 'Perfect Match' : 'Incompatible'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* INGREDIENT BREAKDOWN SECTION */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <h3 className="editorial-heading text-xl italic font-light text-stone-900">
                        Constituent Ingredient Audit ({analysisResult.ingredients.length})
                      </h3>
                      <div className="flex space-x-2 text-[8px] font-bold tracking-widest uppercase">
                        <span className="editorial-tag editorial-tag-safe">Safe</span>
                        <span className="editorial-tag editorial-tag-warning">Caution</span>
                        <span className="editorial-tag editorial-tag-danger">Hazard</span>
                      </div>
                    </div>
                    <div className="rule-line" />

                    <div className="space-y-4">
                      {analysisResult.ingredients.map((ingredient, idx) => {
                        const hasCancerRisk = ingredient.carcinogenicity !== 'None' && ingredient.carcinogenicity !== 'None.';
                        return (
                          <div 
                            key={idx}
                            className="editorial-card p-5 md:p-6 bg-white relative transition-all hover:shadow-md"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-3">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <h4 className="font-serif italic text-lg text-stone-950 font-medium">
                                  {ingredient.name}
                                </h4>
                                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded-sm">
                                  {ingredient.category}
                                </span>
                              </div>
                              <div className="self-start sm:self-auto">
                                {ingredient.status === 'safe' ? (
                                  <span className="editorial-tag editorial-tag-safe">Non-Toxic</span>
                                ) : ingredient.status === 'caution' ? (
                                  <span className="editorial-tag editorial-tag-warning">Caution</span>
                                ) : (
                                  <span className="editorial-tag editorial-tag-danger">Hazard</span>
                                )}
                              </div>
                            </div>

                            {/* HAZARD/CANCER / HEALTH DETAILS */}
                            <div className="space-y-3.5 text-xs">
                              {hasCancerRisk && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-900 rounded-sm flex items-start space-x-2 font-medium">
                                  <AlertTriangle className="w-4 h-4 text-[#D43F3F] mt-0.5 flex-shrink-0" />
                                  <span>
                                    <strong className="font-bold uppercase text-[9px] tracking-wider text-[#D43F3F]">Carcinogenicity Alert:</strong> {ingredient.carcinogenicity}
                                  </span>
                                </div>
                              )}
                              
                              <p className="text-stone-600 leading-relaxed font-normal">
                                <strong className="font-bold text-stone-800 uppercase text-[9px] tracking-widest block mb-1">Toxicological / Physiological Impact:</strong>
                                {ingredient.harmDetails}
                              </p>

                              {/* HEALTHY REPLACEMENTS / ALTERNATIVES */}
                              {ingredient.healthyAlternatives.length > 0 && (
                                <div className="mt-3.5 pt-3.5 border-t border-stone-100">
                                  <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                                    Recommended Structural Substitutes
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {ingredient.healthyAlternatives.map((alt, i) => (
                                      <span 
                                        key={i}
                                        className="bg-stone-50 text-stone-850 text-xs font-serif italic px-3 py-1 rounded-sm border border-stone-250/60"
                                      >
                                        {alt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HEALTHY PRODUCT SWAPS */}
                  <div className="editorial-card p-6 md:p-8 bg-stone-950 text-stone-100 shadow-md relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Apple className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-serif italic text-xl font-light tracking-wide text-white">Recommended Organic Conversions</h3>
                      </div>
                      <div className="rule-line bg-white/20" />
                      <p className="text-xs text-stone-300 leading-relaxed max-w-xl font-normal">
                        Clinical evidence suggests transitioning {analysisResult.productName} to these whole, organic ready-made counterparts:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {analysisResult.generalSwaps.map((swap, idx) => (
                          <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-sm flex flex-col justify-between space-y-2">
                            <div>
                              <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400 mb-1 block">
                                Swapping Strategy {idx + 1}
                              </span>
                              <h4 className="font-serif italic text-sm text-white">
                                {swap.name}
                              </h4>
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed font-normal">
                              {swap.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RESET SCAN BUTTON */}
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center space-x-2.5 bg-stone-900 hover:bg-black border border-black text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-sm shadow-md transition-all active:scale-[0.99]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Scan Another Food Label</span>
                    </button>
                  </div>

                </motion.div>
              ) : (
                /* EMPTY STATE / LANDING PANEL (EDITORIAL ARCHIVE FEEL) */
                <motion.div
                  id="empty-state"
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="editorial-card p-8 text-center min-h-[500px] flex flex-col items-center justify-center space-y-6 bg-white shadow-sm"
                >
                  <div className="p-4 bg-stone-100 border border-stone-200 rounded-sm text-stone-500">
                    <Search className="w-8 h-8" />
                  </div>
                  <div className="space-y-3 max-w-sm">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold block">
                      AURA LAB ANALYSIS REPORT
                    </span>
                    <h3 className="editorial-heading text-2xl italic font-light text-stone-900">
                      No Dossier Compiled Yet
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-normal">
                      Initiate an ingredient list capture via camera scan, image files or textual transcription to produce full carcinogenic, chemical and additive diagnostic analysis.
                    </p>
                  </div>

                  <div className="w-24 h-px bg-stone-200" />

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                      Quick Dossiers
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {PRESETS.slice(0, 2).map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className="bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto mt-20 pt-8 pb-4 px-6 md:px-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center text-[9px] uppercase tracking-[0.2em] opacity-50 font-bold gap-4">
        <span>Clinical sources: WHO, IARC, EFSA & NIH Database</span>
        <span>Secure Health Verification Active</span>
        <span>© Food scan Systems & Gemini Analytical AI</span>
      </footer>
    </div>
  );
}
