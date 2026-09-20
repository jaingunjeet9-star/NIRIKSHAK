/**
 * NIRIKSHAK Consumer Mode — Ingredient Knowledge Database
 * 
 * Separates FOOD knowledge from COSMETIC knowledge.
 * Provides consumer-friendly explanations, everyday functions, nutrition connections,
 * allergen flags, and links to secondary regulatory rules.
 * 
 * Core Principle:
 * An ingredient without a regulatory restriction is labeled "NO_SPECIFIC_CONCERN"
 * with its real-world function, NEVER "Unknown / Manual Review".
 */

import { ConsumerConcernLevel, ProductDomain } from '../types/consumerTypes';

export interface IngredientKnowledgeEntry {
  id: string;
  normalizedName: string;
  synonyms: string[];
  insNumber?: string;
  inciName?: string;
  domain: ProductDomain;
  function: string;
  category: string;
  identityDescription: string;
  nutritionRelevance?: string;
  consumerConcern: ConsumerConcernLevel;
  concernExplanation?: string;
  allergenCategory?: 'MILK' | 'SOY' | 'WHEAT' | 'TREE_NUTS' | 'PEANUTS' | 'EGGS' | 'FISH' | 'SULPHITES' | 'SESAME';
  ruleId?: string; // Links to authoritative FSSAI/CDSCO rule if one exists
}

export const FOOD_INGREDIENT_KNOWLEDGE: IngredientKnowledgeEntry[] = [
  // Sweeteners & Sugars
  {
    id: 'food-sugar',
    normalizedName: 'Sugar',
    synonyms: ['sucrose', 'sugar', 'white sugar', 'cane sugar', 'beet sugar', 'refined sugar', 'sharkara'],
    domain: 'FOOD',
    function: 'Sweetener',
    category: 'Sweeteners',
    identityDescription: 'Standard crystalline sweetener derived from sugarcane or sugar beets.',
    nutritionRelevance: 'Contributes directly to total sugar and added sugar content. Energy-dense with no significant micronutrients.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Common dietary sweetener. Check the nutrition panel for overall sugar amounts.',
    ruleId: 'FSSAI-GEN-SUGAR',
  },
  {
    id: 'food-glucose-syrup',
    normalizedName: 'Glucose Syrup',
    synonyms: ['glucose syrup', 'liquid glucose', 'corn syrup', 'dextrose syrup'],
    domain: 'FOOD',
    function: 'Sweetener & Texture Agent',
    category: 'Sweeteners',
    identityDescription: 'A liquid sweetener made by breaking down starch. Used to provide sweetness and prevent crystallization in confectionery.',
    nutritionRelevance: 'Contributes to added sugars and carbohydrates.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Commonly used in candies and processed foods to maintain chewiness and moisture.',
  },
  {
    id: 'food-invert-sugar',
    normalizedName: 'Invert Sugar Syrup',
    synonyms: ['invert sugar', 'invert sugar syrup', 'inverted sugar'],
    domain: 'FOOD',
    function: 'Sweetener & Moisture Retainer',
    category: 'Sweeteners',
    identityDescription: 'A mixture of glucose and fructose made by splitting table sugar. Retains moisture in baked goods and confections.',
    nutritionRelevance: 'Forms part of the product\'s added sugar content.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
  },
  {
    id: 'food-honey',
    normalizedName: 'Honey',
    synonyms: ['honey', 'pure honey', 'natural honey', 'shahad'],
    domain: 'FOOD',
    function: 'Natural Sweetener',
    category: 'Sweeteners',
    identityDescription: 'Natural sweet substance produced by honeybees from nectar.',
    nutritionRelevance: 'Natural source of fructose and glucose.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
  },
  {
    id: 'food-maltitol',
    normalizedName: 'Maltitol',
    synonyms: ['maltitol', 'maltitol syrup', 'ins 965', 'ins 965(i)', 'ins 965(ii)', 'e965'],
    insNumber: '965',
    domain: 'FOOD',
    function: 'Low-Calorie Sweetener (Polyol)',
    category: 'Sweeteners',
    identityDescription: 'A sugar alcohol used in sugar-free or reduced-sugar confections.',
    nutritionRelevance: 'Provides about half the calories of sugar and does not promote tooth decay.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Excessive consumption can have a mild laxative effect.',
  },
  {
    id: 'food-sucralose',
    normalizedName: 'Sucralose',
    synonyms: ['sucralose', 'ins 955', 'e955', 'splenda'],
    insNumber: '955',
    domain: 'FOOD',
    function: 'Non-Nutritive High-Intensity Sweetener',
    category: 'Sweeteners',
    identityDescription: 'An artificial zero-calorie sweetener approximately 600 times sweeter than table sugar.',
    nutritionRelevance: 'Contributes zero calories and does not raise blood glucose.',
    consumerConcern: 'RESTRICTED_USAGE',
    concernExplanation: 'Permitted non-caloric sweetener subject to statutory maximum limits under FSSAI.',
    ruleId: 'FSSAI-ADD-955',
  },

  // Fats & Oils
  {
    id: 'food-hydrogenated-fat',
    normalizedName: 'Hydrogenated Vegetable Fat',
    synonyms: [
      'fully hydrogenated vegetable fat',
      'hydrogenated vegetable fat',
      'hydrogenated vegetable oil',
      'partially hydrogenated vegetable oil',
      'hydrogenated fat',
      'vanaspati',
      'shortening',
    ],
    domain: 'FOOD',
    function: 'Firming Fat & Texture Stabilizer',
    category: 'Fats & Oils',
    identityDescription: 'Vegetable oil processed through hydrogenation to give foods a firm texture, melt-resistance, and long shelf life.',
    nutritionRelevance: 'Significantly increases the saturated fat content of the food.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Adds saturated fats to give firm texture. Look at the saturated fat row on the nutrition panel.',
  },
  {
    id: 'food-palm-oil',
    normalizedName: 'Palm Oil / Palmolein',
    synonyms: ['palm oil', 'palmolein', 'refined palm oil', 'palm kernel oil', 'fractionated palm fat'],
    domain: 'FOOD',
    function: 'Cooking & Texture Fat',
    category: 'Fats & Oils',
    identityDescription: 'Edible plant oil derived from the fruit of oil palms. Stable at high temperatures and widely used in confections.',
    nutritionRelevance: 'Naturally composed of roughly 50% saturated fat.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Plant-derived cooking fat widely used in chocolates, biscuits, and savoury snacks.',
  },
  {
    id: 'food-cocoa-butter',
    normalizedName: 'Cocoa Butter',
    synonyms: ['cocoa butter', 'cacao butter', 'theobroma oil'],
    domain: 'FOOD',
    function: 'Primary Chocolate Fat',
    category: 'Fats & Oils',
    identityDescription: 'Natural fat extracted from whole cocoa beans. Responsible for chocolate\'s signature smooth, melt-in-the-mouth texture.',
    nutritionRelevance: 'Natural plant fat containing stearic and palmitic saturated fatty acids.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Essential core ingredient in authentic milk and dark chocolate.',
  },
  {
    id: 'food-milk-fat',
    normalizedName: 'Milk Fat / Butterfat',
    synonyms: ['milk fat', 'butterfat', 'anhydrous milk fat', 'butter oil', 'ghee'],
    domain: 'FOOD',
    function: 'Dairy Fat & Flavour Enhancer',
    category: 'Fats & Oils',
    identityDescription: 'Natural dairy fat separated from fresh milk or cream.',
    nutritionRelevance: 'Provides rich dairy mouthfeel; contributes to saturated fat.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    allergenCategory: 'MILK',
    concernExplanation: 'Natural dairy component. Contains milk allergens.',
  },
  {
    id: 'food-sunflower-oil',
    normalizedName: 'Sunflower Oil',
    synonyms: ['sunflower oil', 'refined sunflower oil', 'high oleic sunflower oil'],
    domain: 'FOOD',
    function: 'Vegetable Cooking Oil',
    category: 'Fats & Oils',
    identityDescription: 'Edible plant oil pressed from sunflower seeds. Rich in polyunsaturated and monounsaturated fatty acids.',
    nutritionRelevance: 'Low in saturated fat compared to tropical oils.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
  },

  // Dairy & Cocoa
  {
    id: 'food-milk-solids',
    normalizedName: 'Milk Solids',
    synonyms: ['milk solids', 'whole milk powder', 'skimmed milk powder', 'dairy solids', 'whey powder', 'milk protein'],
    domain: 'FOOD',
    function: 'Dairy Body & Protein Provider',
    category: 'Dairy Ingredients',
    identityDescription: 'Concentrated natural milk components (proteins, lactose, and minerals) with water removed.',
    nutritionRelevance: 'Contributes valuable dairy protein, calcium, and milk sugars (lactose).',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    allergenCategory: 'MILK',
    concernExplanation: 'Contains dairy allergen (milk). Avoid if you have cow\'s milk allergy or severe lactose intolerance.',
  },
  {
    id: 'food-cocoa-mass',
    normalizedName: 'Cocoa Mass / Cocoa Solids',
    synonyms: ['cocoa mass', 'cocoa liquor', 'chocolate liquor', 'cocoa solids', 'cacao mass', 'unsweetened chocolate'],
    domain: 'FOOD',
    function: 'Core Chocolate Flavour & Body',
    category: 'Main Ingredients',
    identityDescription: 'Pure roasted cocoa beans ground into a smooth paste containing both cocoa solids and natural cocoa butter.',
    nutritionRelevance: 'Contains dietary fibre, minerals (iron, magnesium), and polyphenolic antioxidants.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
  },
  {
    id: 'food-cocoa-powder',
    normalizedName: 'Cocoa Powder',
    synonyms: ['cocoa powder', 'fat-reduced cocoa powder', 'dutch cocoa', 'alkalized cocoa'],
    domain: 'FOOD',
    function: 'Flavour & Colour Agent',
    category: 'Main Ingredients',
    identityDescription: 'Cocoa solids remaining after cocoa butter is pressed out of cocoa liquor.',
    nutritionRelevance: 'Provides rich chocolate flavour and dietary fibre with minimal fat.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
  },

  // Flours & Grains
  {
    id: 'food-wheat-flour',
    normalizedName: 'Wheat Flour (Maida / Atta)',
    synonyms: ['wheat flour', 'refined wheat flour', 'maida', 'atta', 'whole wheat flour', 'enriched wheat flour'],
    domain: 'FOOD',
    function: 'Structural Flour Base',
    category: 'Main Ingredients',
    identityDescription: 'Milled cereal grain used as the primary foundation for biscuits, bread, wafers, and doughs.',
    nutritionRelevance: 'Primary source of complex carbohydrates and vegetable protein (gluten).',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    allergenCategory: 'WHEAT',
    concernExplanation: 'Contains wheat gluten. Must be avoided by individuals with celiac disease or wheat allergies.',
  },

  // Emulsifiers & Texture Additives
  {
    id: 'food-soya-lecithin',
    normalizedName: 'Soya Lecithin (INS 322)',
    synonyms: ['soya lecithin', 'soy lecithin', 'lecithin', 'ins 322', 'ins 322(i)', 'e322'],
    insNumber: '322',
    domain: 'FOOD',
    function: 'Emulsifier',
    category: 'Emulsifiers & Stabilizers',
    identityDescription: 'Natural plant substance derived from soybeans that helps fat and water blend smoothly and stay mixed.',
    nutritionRelevance: 'Used in tiny amounts (usually under 0.5%) to control viscosity in chocolate.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    allergenCategory: 'SOY',
    concernExplanation: 'Commonly derived from soybeans. Individuals with severe soy allergy should note its presence.',
    ruleId: 'FSSAI-ADD-322',
  },
  {
    id: 'food-mono-diglycerides',
    normalizedName: 'Mono- and Diglycerides of Fatty Acids (INS 471)',
    synonyms: ['mono- and diglycerides of fatty acids', 'ins 471', 'e471', 'glyceryl monostearate'],
    insNumber: '471',
    domain: 'FOOD',
    function: 'Emulsifier & Crumb Softener',
    category: 'Emulsifiers & Stabilizers',
    identityDescription: 'Food additive composed of plant or animal fats used to keep textures soft and prevent oil separation.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Widely used in baked foods, margarine, and ice cream to blend fats smoothly.',
    ruleId: 'FSSAI-ADD-471',
  },

  // Acidulants & Preservatives
  {
    id: 'food-citric-acid',
    normalizedName: 'Citric Acid (INS 330)',
    synonyms: ['citric acid', 'ins 330', 'e330', 'nimbu ka sat'],
    insNumber: '330',
    domain: 'FOOD',
    function: 'Acidity Regulator & Antioxidant Synergist',
    category: 'Acidity Regulators',
    identityDescription: 'Natural fruit acid found in citrus fruits. Imparts tartness and helps preserve freshness.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Safe, standard food acid used throughout the food industry to control tartness.',
    ruleId: 'FSSAI-ADD-330',
  },
  {
    id: 'food-sodium-benzoate',
    normalizedName: 'Sodium Benzoate (INS 211)',
    synonyms: ['sodium benzoate', 'ins 211', 'e211', 'benzoic acid sodium salt'],
    insNumber: '211',
    domain: 'FOOD',
    function: 'Antimicrobial Preservative',
    category: 'Preservatives',
    identityDescription: 'A food preservative that prevents the growth of yeasts, molds, and bacteria in beverages, jams, and sauces.',
    consumerConcern: 'RESTRICTED_USAGE',
    concernExplanation: 'Permitted food preservative capped at statutory maximum limits under FSSAI regulations.',
    ruleId: 'FSSAI-ADD-211',
  },
  {
    id: 'food-potassium-sorbate',
    normalizedName: 'Potassium Sorbate (INS 202)',
    synonyms: ['potassium sorbate', 'ins 202', 'e202'],
    insNumber: '202',
    domain: 'FOOD',
    function: 'Antifungal Preservative',
    category: 'Preservatives',
    identityDescription: 'Preservative that inhibits mold and yeast growth in cheese, baked goods, and syrups.',
    consumerConcern: 'RESTRICTED_USAGE',
    concernExplanation: 'Permitted preservative subject to statutory concentration limits.',
    ruleId: 'FSSAI-ADD-202',
  },

  // Permitted & Prohibited Colours
  {
    id: 'food-sunset-yellow',
    normalizedName: 'Sunset Yellow FCF (INS 110)',
    synonyms: ['sunset yellow', 'sunset yellow fcf', 'ins 110', 'e110', 'fd&c yellow 6'],
    insNumber: '110',
    domain: 'FOOD',
    function: 'Synthetic Food Colourant',
    category: 'Colouring Agents',
    identityDescription: 'Permitted synthetic azo dye that imparts an orange-yellow colour to confectionery, drinks, and desserts.',
    consumerConcern: 'RESTRICTED_USAGE',
    concernExplanation: 'Permitted synthetic dye strictly restricted to a maximum of 100 mg/kg under FSSAI.',
    ruleId: 'FSSAI-COL-110',
  },
  {
    id: 'food-metanil-yellow',
    normalizedName: 'Metanil Yellow (Industrial Dye)',
    synonyms: ['metanil yellow', 'acid yellow 36', 'non-permitted yellow dye'],
    domain: 'FOOD',
    function: 'Prohibited Industrial Dye',
    category: 'Prohibited Adulterants',
    identityDescription: 'A toxic industrial chemical dye used in paints and textiles. Strictly illegal in all food products.',
    consumerConcern: 'PROHIBITED',
    concernExplanation: 'Toxic industrial dye strictly prohibited from use in any food by FSSAI.',
    ruleId: 'FSSAI-PRO-MY',
  },

  // Salt & Seasoning
  {
    id: 'food-salt',
    normalizedName: 'Iodised Salt',
    synonyms: ['salt', 'iodised salt', 'iodized salt', 'sodium chloride', 'edible salt', 'namak'],
    domain: 'FOOD',
    function: 'Seasoning & Flavour Enhancer',
    category: 'Seasonings',
    identityDescription: 'Purified mineral salt fortified with iodine as required by Indian public health mandates.',
    nutritionRelevance: 'Primary source of dietary sodium. High dietary sodium intake is linked to elevated blood pressure.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Essential mineral for seasoning. Check sodium level on nutrition panel if monitoring blood pressure.',
  },
  {
    id: 'food-potable-water',
    normalizedName: 'Potable Water',
    synonyms: ['water', 'potable water', 'purified water', 'pani'],
    domain: 'FOOD',
    function: 'Solvent & Hydration Base',
    category: 'Main Ingredients',
    identityDescription: 'Safe drinking water meeting Bureau of Indian Standards (IS 10500).',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    ruleId: 'FSSAI-GEN-WATER',
  },
];

export const COSMETIC_INGREDIENT_KNOWLEDGE: IngredientKnowledgeEntry[] = [
  // Solvents & Bases
  {
    id: 'cos-water',
    normalizedName: 'Water (Aqua)',
    synonyms: ['aqua', 'water', 'purified water', 'eau', 'aqua/water/eau'],
    inciName: 'AQUA',
    domain: 'COSMETIC',
    function: 'Solvent & Carrier Base',
    category: 'Solvents & Bases',
    identityDescription: 'Purified deionized water serving as the fluid base for dissolving other cosmetic ingredients.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Standard, gentle liquid base in skincare, lotions, and shampoos.',
    ruleId: 'CDSCO-COS-003',
  },
  {
    id: 'cos-alcohol-denat',
    normalizedName: 'Alcohol Denat. (Denatured Alcohol)',
    synonyms: ['alcohol denat', 'alcohol denat.', 'denatured alcohol', 'sd alcohol', 'ethanol'],
    inciName: 'ALCOHOL DENAT.',
    domain: 'COSMETIC',
    function: 'Astringent, Solvent & Quick-Dry Agent',
    category: 'Solvents & Bases',
    identityDescription: 'Fast-evaporating simple alcohol that gives formulas a lightweight, non-greasy feel.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Can be drying or sensitizing when used in high concentrations, particularly for dry or sensitive skin.',
  },

  // Humectants & Moisturizers
  {
    id: 'cos-glycerin',
    normalizedName: 'Glycerin',
    synonyms: ['glycerin', 'glycerol', 'glycerine'],
    inciName: 'GLYCERIN',
    domain: 'COSMETIC',
    function: 'Humectant Moisturizer',
    category: 'Moisturizers & Humectants',
    identityDescription: 'A gentle, plant-derived humectant that attracts water from the atmosphere and deeper skin layers into the surface.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Proven, effective, and non-irritating moisturizing ingredient suitable for all skin types.',
    ruleId: 'CDSCO-COS-002',
  },
  {
    id: 'cos-hyaluronic-acid',
    normalizedName: 'Hyaluronic Acid / Sodium Hyaluronate',
    synonyms: ['hyaluronic acid', 'sodium hyaluronate', 'hydrolyzed hyaluronic acid'],
    inciName: 'SODIUM HYALURONATE',
    domain: 'COSMETIC',
    function: 'Deep Hydrating Humectant',
    category: 'Moisturizers & Humectants',
    identityDescription: 'A naturally occurring sugar molecule in the skin capable of holding up to 1,000 times its weight in water.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Highly compatible skin hydrator providing plumping and surface moisture without clogging pores.',
  },
  {
    id: 'cos-panthenol',
    normalizedName: 'Panthenol (Pro-Vitamin B5)',
    synonyms: ['panthenol', 'd-panthenol', 'pro-vitamin b5', 'provitamin b5'],
    inciName: 'PANTHENOL',
    domain: 'COSMETIC',
    function: 'Soothing Agent & Barrier Repair',
    category: 'Moisturizers & Humectants',
    identityDescription: 'A provitamin that penetrates the skin, converts to pantothenic acid, and helps soothe irritated or compromised skin barriers.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Gentle, skin-repairing ingredient frequently used in baby creams and post-sun lotions.',
  },
  {
    id: 'cos-propylene-glycol',
    normalizedName: 'Propylene Glycol',
    synonyms: ['propylene glycol', '1,2-propanediol'],
    inciName: 'PROPYLENE GLYCOL',
    domain: 'COSMETIC',
    function: 'Humectant & Penetration Enhancer',
    category: 'Moisturizers & Humectants',
    identityDescription: 'A small-molecule humectant that helps creams retain moisture and enhances the absorption of other active ingredients.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Generally well tolerated, but can cause contact dermatitis or irritation in people with very reactive skin.',
  },

  // Actives & Vitamins
  {
    id: 'cos-niacinamide',
    normalizedName: 'Niacinamide (Vitamin B3)',
    synonyms: ['niacinamide', 'nicotinamide', 'vitamin b3'],
    inciName: 'NIACINAMIDE',
    domain: 'COSMETIC',
    function: 'Skin-Conditioning Active',
    category: 'Skin Actives',
    identityDescription: 'Water-soluble form of Vitamin B3 that supports the skin lipid barrier, reduces uneven tone, and calms redness.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Safe, versatile cosmetic active permitted under Indian and international cosmetics frameworks.',
    ruleId: 'CDSCO-COS-001',
  },
  {
    id: 'cos-salicylic-acid',
    normalizedName: 'Salicylic Acid (BHA)',
    synonyms: ['salicylic acid', '2-hydroxybenzoic acid'],
    inciName: 'SALICYLIC ACID',
    domain: 'COSMETIC',
    function: 'Exfoliant & Anti-Acne Active',
    category: 'Skin Actives',
    identityDescription: 'Oil-soluble Beta Hydroxy Acid that penetrates inside pores to clear dead skin cells and sebum buildup.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Effective pore exfoliant, but can cause dryness, peeling, or sun sensitivity. Patch testing is recommended.',
  },
  {
    id: 'cos-tocopherol',
    normalizedName: 'Tocopherol (Vitamin E)',
    synonyms: ['tocopherol', 'tocopheryl acetate', 'vitamin e', 'alpha-tocopherol'],
    inciName: 'TOCOPHEROL',
    domain: 'COSMETIC',
    function: 'Antioxidant & Skin Conditioner',
    category: 'Antioxidants',
    identityDescription: 'Fat-soluble antioxidant protecting formulation lipids from rancidity and conditioning skin.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Approved natural antioxidant helping protect product stability and soften skin.',
    ruleId: 'CDSCO-COS-004',
  },

  // Emollients & Silicones
  {
    id: 'cos-dimethicone',
    normalizedName: 'Dimethicone',
    synonyms: ['dimethicone', 'polydimethylsiloxane', 'dimethicone copolyol'],
    inciName: 'DIMETHICONE',
    domain: 'COSMETIC',
    function: 'Skin Protectant & Silicone Emollient',
    category: 'Emollients & Conditioners',
    identityDescription: 'A smooth silicone fluid that forms a breathable protective barrier on skin surface, preventing water loss.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Widely used, inert barrier-protecting emollient. Non-comedogenic and hypoallergenic in formulation.',
  },
  {
    id: 'cos-cetearyl-alcohol',
    normalizedName: 'Cetearyl Alcohol',
    synonyms: ['cetearyl alcohol', 'cetyl stearyl alcohol'],
    inciName: 'CETEARYL ALCOHOL',
    domain: 'COSMETIC',
    function: 'Fatty Alcohol Emollient & Emulsion Thickener',
    category: 'Emollients & Conditioners',
    identityDescription: 'A plant-derived fatty alcohol (not a drying alcohol) that softens the skin and thickens lotions and conditioners.',
    consumerConcern: 'NO_SPECIFIC_CONCERN',
    concernExplanation: 'Moisturizing fatty alcohol, very different from drying simple alcohol.',
  },

  // Surfactants & Cleansers
  {
    id: 'cos-sles',
    normalizedName: 'Sodium Laureth Sulfate (SLES)',
    synonyms: ['sodium laureth sulfate', 'sles', 'sodium lauryl ether sulfate'],
    inciName: 'SODIUM LAURETH SULFATE',
    domain: 'COSMETIC',
    function: 'Foaming Surfactant & Cleanser',
    category: 'Surfactants & Cleansers',
    identityDescription: 'Cleansing agent that creates rich lather to wash away surface oils and dirt in shampoos and face washes.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Effective cleanser; gentler than SLS, but can be drying for eczema-prone or very sensitive skin.',
  },
  {
    id: 'cos-sls',
    normalizedName: 'Sodium Lauryl Sulfate (SLS)',
    synonyms: ['sodium lauryl sulfate', 'sls'],
    inciName: 'SODIUM LAURYL SULFATE',
    domain: 'COSMETIC',
    function: 'Strong Foaming Surfactant',
    category: 'Surfactants & Cleansers',
    identityDescription: 'Potent cleansing and lathering surfactant.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Can cause skin dryness or irritation, especially on delicate facial skin or for those prone to irritation.',
  },

  // Preservatives
  {
    id: 'cos-phenoxyethanol',
    normalizedName: 'Phenoxyethanol',
    synonyms: ['phenoxyethanol', '2-phenoxyethanol'],
    inciName: 'PHENOXYETHANOL',
    domain: 'COSMETIC',
    function: 'Antimicrobial Preservative',
    category: 'Preservatives',
    identityDescription: 'Broad-spectrum preservative used to prevent dangerous bacterial and fungal growth in water-based cosmetics.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Regulated cosmetic preservative legally capped at a maximum 1.0% in India to ensure dermal safety.',
    ruleId: 'CDSCO-COS-006',
  },
  {
    id: 'cos-methylparaben',
    normalizedName: 'Methylparaben',
    synonyms: ['methylparaben', 'methyl 4-hydroxybenzoate', 'ins 218'],
    inciName: 'METHYLPARABEN',
    domain: 'COSMETIC',
    function: 'Cosmetic Preservative',
    category: 'Preservatives',
    identityDescription: 'Traditional paraben preservative protecting creams and lotions from mold and bacterial contamination.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Approved cosmetic preservative subject to statutory concentration limits (max 0.4% as single ester).',
    ruleId: 'CDSCO-COS-007',
  },

  // Fragrance & Sensitizers
  {
    id: 'cos-fragrance',
    normalizedName: 'Fragrance / Parfum',
    synonyms: ['fragrance', 'parfum', 'aroma', 'perfume'],
    inciName: 'PARFUM',
    domain: 'COSMETIC',
    function: 'Scent & Masking Blend',
    category: 'Fragrance & Scent',
    identityDescription: 'A proprietary blend of natural or synthetic aromatic compounds used to give products a pleasant scent.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Fragrance blends are one of the most common causes of skin sensitization or contact dermatitis, particularly for sensitive skin.',
    ruleId: 'CDSCO-COS-005',
  },
  {
    id: 'cos-linalool',
    normalizedName: 'Linalool',
    synonyms: ['linalool', '3,7-dimethylocta-1,6-dien-3-ol'],
    inciName: 'LINALOOL',
    domain: 'COSMETIC',
    function: 'Naturally Occurring Fragrance Component',
    category: 'Fragrance & Scent',
    identityDescription: 'Natural floral scent compound found in lavender, citrus, and mint. Can oxidize over time upon air exposure.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Known fragrance allergen that can trigger contact allergies in sensitive individuals when oxidized.',
  },
  {
    id: 'cos-limonene',
    normalizedName: 'Limonene',
    synonyms: ['limonene', 'd-limonene'],
    inciName: 'LIMONENE',
    domain: 'COSMETIC',
    function: 'Citrus Scent Compound',
    category: 'Fragrance & Scent',
    identityDescription: 'Aromatic citrus compound derived from citrus rinds.',
    consumerConcern: 'POTENTIAL_CONCERN',
    concernExplanation: 'Recognized fragrance allergen component; may cause sensitivity in allergic or reactive skin.',
  },

  // Prohibited Cosmetic Ingredients
  {
    id: 'cos-hexachlorophene',
    normalizedName: 'Hexachlorophene',
    synonyms: ['hexachlorophene', '2,2-methylenebis(3,4,6-trichlorophenol)'],
    inciName: 'HEXACHLOROPHENE',
    domain: 'COSMETIC',
    function: 'Prohibited Antibacterial Compound',
    category: 'Prohibited Substances',
    identityDescription: 'Organochlorine compound banned from all cosmetics in India due to documented neurotoxic hazards.',
    consumerConcern: 'PROHIBITED',
    concernExplanation: 'Banned from all cosmetic formulations in India by the CDSCO under the Drugs & Cosmetics Rules.',
    ruleId: 'CDSCO-PRO-HEXA',
  },
  {
    id: 'cos-mercury',
    normalizedName: 'Mercury & Mercurial Compounds',
    synonyms: ['mercury', 'mercurous chloride', 'calomel', 'ammoniated mercury'],
    domain: 'COSMETIC',
    function: 'Prohibited Skin-Lightening Compound',
    category: 'Prohibited Substances',
    identityDescription: 'Heavy metal prohibited in cosmetics due to severe toxicity, kidney damage, and nervous system harm.',
    consumerConcern: 'PROHIBITED',
    concernExplanation: 'Strictly prohibited from all cosmetics under Indian law.',
    ruleId: 'CDSCO-PRO-MERC',
  },
];

/**
 * Searches the Knowledge Base for a normalized ingredient string.
 */
export function lookupIngredientKnowledge(
  normalizedQuery: string,
  domain: ProductDomain
): IngredientKnowledgeEntry | null {
  const clean = normalizedQuery.trim().toLowerCase();
  const dataset = domain === 'COSMETIC' ? COSMETIC_INGREDIENT_KNOWLEDGE : FOOD_INGREDIENT_KNOWLEDGE;

  // 1. Direct name match
  for (const entry of dataset) {
    if (entry.normalizedName.toLowerCase() === clean) return entry;
    for (const syn of entry.synonyms) {
      if (syn.toLowerCase() === clean) return entry;
    }
  }

  // 2. Cross-domain fallback (e.g. Water or Citric Acid found in cosmetic or food)
  const otherDataset = domain === 'COSMETIC' ? FOOD_INGREDIENT_KNOWLEDGE : COSMETIC_INGREDIENT_KNOWLEDGE;
  for (const entry of otherDataset) {
    if (entry.normalizedName.toLowerCase() === clean) {
      return {
        ...entry,
        domain, // adapt to current domain
      };
    }
    for (const syn of entry.synonyms) {
      if (syn.toLowerCase() === clean) {
        return {
          ...entry,
          domain,
        };
      }
    }
  }

  return null;
}
