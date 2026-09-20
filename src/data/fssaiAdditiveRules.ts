/**
 * NIRIKSHAK — FSSAI Appendix A Food Additive Permission Database
 *
 * Source: Food Safety and Standards (Food Products Standards and Food Additives)
 *         Regulations, 2011 — Version-XXIV (01.07.2022)
 *         Extracted from FSSAI_INGREDIENT_RULES_README.md (source pages 547–704)
 *
 * IMPORTANT:
 *   - These rules are DIFFERENT from fssaiLabRules.ts (contaminants/microbiological).
 *   - These answer: "Is additive X permitted in food category Y? At what max level?"
 *   - "GMP" must NEVER be converted to a numeric limit.
 *   - "No additives permitted" means ANY additive in that category → NOT_PERMITTED.
 *   - Tables 13 (Special nutritional uses) and 15 (Ready-to-eat savouries) are
 *     stubbed as MANUAL_REVIEW — data not included in the reference dataset.
 *   - Table 14 (Beverages) is partially included (14.1.1 and 14.1.2.1 only).
 *   - Do NOT invent FSSAI limits. If a rule cannot be matched, return MANUAL_REVIEW.
 */

import {
  FSSAIAdditiveRule,
  FSSAIProhibitedSubstance,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// VERSION & SOURCE CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const FSSAI_ADDITIVE_RULES_VERSION = 'Version-XXIV (01.07.2022)';
export const FSSAI_ADDITIVE_RULES_SOURCE =
  'FSS (Food Products Standards and Food Additives) Regulations, 2011 — Appendix A';
export const FSSAI_ADDITIVE_RULES_EFFECTIVE_DATE = '2022-07-01';

// ─────────────────────────────────────────────────────────────────────────────
// FOOD CATEGORY CODE → NAME MAP
// Source: README §5, Appendix A tables
// ─────────────────────────────────────────────────────────────────────────────

export const FSSAI_FOOD_CATEGORY_CODES: Record<string, string> = {
  '1.0': 'Dairy products and analogues, excluding products of food category 2.0',
  '1.1': 'Milk and dairy-based drinks',
  '1.1.1': 'Milk and buttermilk (plain)',
  '1.1.1.1': 'Milk (plain)',
  '1.1.1.2': 'Buttermilk (plain)',
  '1.1.2': 'Dairy-based drinks — flavoured milk and/or fermented',
  '1.2': 'Fermented and renneted milk products (plain)',
  '1.2.1': 'Fermented milks (plain)',
  '1.2.1.1': 'Fermented milks (plain) not heat treated after fermentation',
  '1.2.1.2': 'Fermented milks (plain) heat treated after fermentation',
  '1.2.2': 'Renneted milk (plain)',
  '1.3': 'Condensed/evaporated milk and analogues (plain)',
  '1.3.1': 'Condensed milk (plain), evaporated milk(s), sweetened condensed milk(s)',
  '1.3.2': 'Beverage whitener',
  '1.3.2.1': 'Non dairy based beverage whitener',
  '1.4': 'Cream (plain) and the like cream and malai',
  '1.4.1': 'Pasteurized cream (plain), cream and malai',
  '1.4.2': 'Sterilized and UHT creams, whipping and whipped creams, and reduced fat creams (plain)',
  '1.4.3': 'Clotted cream (plain)',
  '1.4.4': 'Cream analogues',
  '1.5': 'Milk powder and cream powder and powder analogues (plain)',
  '1.5.1': 'Milk powder and cream powder (plain)',
  '1.5.1.1': 'Dairy based dairy whitener',
  '1.5.2': 'Powder analogues',
  '1.6': 'Cheese and analogues',
  '1.6.1': 'Unripened cheese',
  '1.6.2': 'Ripened cheese',
  '1.6.2.1': 'Ripened cheese includes rind',
  '1.6.2.2': 'Rind of ripened cheese',
  '1.6.2.3': 'Cheese powder',
  '1.6.3': 'Whey cheese',
  '1.6.4': 'Processed cheese',
  '1.6.4.1': 'Plain processed cheese / processed cheese spreads',
  '1.6.4.2': 'Flavoured processed cheese',
  '1.6.5': 'Cheese analogues',
  '1.6.6': 'Whey protein cheese',
  '1.7': 'Dairy based desserts',
  '1.8': 'Whey and whey products excluding whey cheeses',
  '1.8.1': 'Liquid whey and whey products excluding whey cheeses',
  '1.8.2': 'Dried whey and whey products, excluding whey cheeses',
  '2.0': 'Fats and oils, and fat emulsions',
  '2.1': 'Fats and oils essentially free from water',
  '2.1.1': 'Butter oil, anhydrous milk fat and ghee',
  '2.1.2': 'Vegetable oils, fats and bakery shortenings',
  '2.1.3': 'Lard, tallow, fish oil, and other animal fats',
  '2.2': 'Fat emulsions mainly of type water-in-oil',
  '2.2.1': 'Butter (Butter and Milk Fat)',
  '2.2.2': 'Fat spreads, dairy fat spreads and blended spreads (margarine and fat spreads)',
  '2.3': 'Fat emulsions mainly of type oil-in-water',
  '2.4': 'Fat-based desserts excluding dairy-based dessert products',
  '2.4.1': 'Cocoa based spreads including fillings',
  '3.0': 'Edible ices, including sorbet (ice candy)',
  '4.0': 'Fruits and vegetables, seaweeds, nuts and seeds',
  '4.1': 'Fruits',
  '4.1.1': 'Fresh fruits',
  '4.1.1.1': 'Untreated fresh fruits',
  '4.1.1.2': 'Surface-treated fresh fruits',
  '4.1.1.3': 'Peeled or cut minimally processed fruits',
  '4.1.2': 'Processed fruits',
  '4.1.2.1': 'Frozen fruits',
  '4.1.2.2': 'Dried fruits, nuts and seeds',
  '4.1.2.3': 'Fruit in vinegar, oil, or brine',
  '4.1.2.4': 'Canned or bottled (pasteurized) fruit',
  '4.1.2.5': 'Jams, jellies, marmalades',
  '4.1.2.6': 'Fruit-based spreads (e.g. chutney)',
  '4.1.2.7': 'Candied / glazed / crystallised fruit including murrabba',
  '4.1.2.8': 'Fruit preparations, including fruit pulp, purees, toppings and coconut milk',
  '4.1.2.9': 'Fruit-based desserts including fruit-flavoured water-based desserts',
  '4.1.2.10': 'Fermented fruit products',
  '4.1.2.11': 'Fruit fillings for pastries',
  '4.1.2.12': 'Cooked fruit',
  '4.2': 'Vegetables, sea weeds, nuts and seeds',
  '4.2.1': 'Fresh vegetables, sea weeds, nuts and seeds',
  '4.2.1.1': 'Untreated fresh vegetables, sea weeds, nuts and seeds',
  '4.2.1.2': 'Surface treated fresh vegetables, sea weeds, nuts and seeds',
  '4.2.1.3': 'Peeled, cut or shredded minimally processed vegetables',
  '4.2.2': 'Processed vegetables, sea weeds, nuts and seeds',
  '4.2.2.1': 'Frozen vegetables, sea weeds, nuts and seeds',
  '4.2.2.2': 'Dried vegetables, sea weeds, nuts and seeds',
  '4.2.2.3': 'Vegetables in vinegar, oil, brine or soybean sauce',
  '4.2.2.4': 'Canned or bottled (pasteurised) or retort pouched vegetables',
  '4.2.2.5': 'Vegetables — purees and spreads (peanut butter)',
  '4.2.2.6': 'Vegetables — pulps and preparations',
  '4.2.2.7': 'Fermented vegetables',
  '4.2.2.8': 'Cooked or fried vegetables',
  '5.0': 'Confectionery',
  '5.1': 'Cocoa products and chocolate products',
  '5.1.1': 'Cocoa mixes (powders) and cocoa mass/cake',
  '5.1.2': 'Cocoa mixes (syrups)',
  '5.1.3': 'Cocoa and chocolate products',
  '5.1.4': 'Imitation chocolate, chocolate substitute products',
  '5.2': 'Confectionery including hard and soft candy, nougats',
  '5.2.1': 'Hard candy',
  '5.2.2': 'Soft candy',
  '5.2.3': 'Nougats and marzipans',
  '5.3': 'Chewing gum',
  '5.4': 'Decorations, toppings (non-fruit) and sweet sauces',
  '6.0': 'Cereals and cereal products',
  '6.1': 'Whole, broken, or flaked grain, including rice',
  '6.2': 'Flours and starches',
  '6.2.1': 'Flours and starches',
  '6.2.2': 'Flours and starches',
  '6.3': 'Ready-to-eat cereals, breakfast cereals, including rolled oats',
  '6.4': 'Pastas and noodles and like products',
  '6.4.1': 'Fresh pastas and noodles and like products',
  '6.4.2': 'Dried pastas and noodles and like products',
  '6.4.3': 'Pre-cooked pastas and noodles and like products',
  '6.5': 'Cereals/pulses and starch based desserts',
  '6.6': 'Batters',
  '6.7': 'Pre-cooked or processed cereal/grain/legume products',
  '6.8': 'Soybean products',
  '6.8.1': 'Soybean based beverages',
  '6.8.2': 'Soybean-based beverage film',
  '6.8.3': 'Soybean curd (tofu)',
  '6.8.8': 'Other soybean protein products',
  '7.0': 'Bakery products',
  '7.1': 'Bread and ordinary bakery wares and mixes',
  '7.1.1': 'Bread and rolls including yeast leavened breads',
  '7.1.2': 'Crackers',
  '7.1.3': 'Other ordinary bakery products',
  '7.1.4': 'Bread-type products, including bread stuffing and bread crumbs',
  '7.1.5': 'Steamed breads and buns',
  '7.1.6': 'Mixes for bread and ordinary bakery wares',
  '7.2': 'Fine bakery wares (sweet, salty, savoury) and mixes',
  '7.2.1': 'Cakes, cookies, biscuit, cracker and pies',
  '7.2.2': 'Other fine bakery products',
  '7.2.3': 'Mixes for fine bakery wares',
  '8.0': 'Fresh / frozen / chilled / ground meat, poultry',
  '8.1': 'Fresh / frozen / chilled / ground meat and poultry',
  '8.1.1': 'Fresh / frozen / chilled meat, poultry, whole pieces or cuts',
  '8.1.2': 'Fresh / frozen / chilled meat, poultry, comminuted',
  '8.2': 'Processed meat and poultry products in whole pieces or cuts',
  '8.2.1': 'Non-heat treated processed meat and poultry products',
  '8.2.1.2': 'Cured and dried processed meat and poultry products',
  '8.2.1.3': 'Fermented non-heated treated processed meat and poultry products',
  '8.2.2': 'Heat-treated processed meat and poultry products in whole pieces or cuts',
  '8.2.3': 'Frozen raw, flavoured/marinated, processed meat and poultry products',
  '8.3': 'Processed comminuted meat and poultry products',
  '8.3.1': 'Non-heat treated processed comminuted meat and poultry products',
  '8.3.1.2': 'Cured and dried processed comminuted meat and poultry products',
  '8.3.1.3': 'Fermented non-heat treated processed comminuted meat and poultry products',
  '8.3.2': 'Heat-treated processed comminuted meat and poultry products',
  '8.3.3': 'Frozen processed comminuted meat and poultry products',
  '8.4': 'Edible casings',
  '9.0': 'Fish and fish products, including molluscs, crustaceans, and echinoderms',
  '9.1': 'Fresh fish and fish products',
  '9.1.1': 'Fresh fish',
  '9.1.2': 'Fresh molluscs, crustaceans, and echinoderms',
  '9.2': 'Processed fish and fish products',
  '9.2.1': 'Frozen fish, fish fillets, and fish products',
  '9.2.2': 'Frozen battered fish, fish fillets and fish products',
  '9.2.3': 'Frozen minced and creamed fish products',
  '9.2.4': 'Cooked and/or fried fish and fish products',
  '9.2.4.1': 'Cooked fish and fish products',
  '9.2.4.2': 'Cooked molluscs, crustaceans, and echinoderms',
  '9.2.4.3': 'Fried fish and fish products',
  '9.2.5': 'Smoked, dried, fermented, and/or salted fish and fish products',
  '9.3': 'Semi preserved fish and fish products',
  '9.3.1': 'Fish and fish products, marinated and/or in jelly',
  '9.3.2': 'Fish and fish products, pickled and/or in brine',
  '9.3.3': 'Salmon substitutes, caviar and other fish roe products',
  '9.3.4': 'Semi-preserved fish and fish products (e.g. fish paste)',
  '9.4': 'Fully preserved including canned or fermented fish and fish products',
  '10.0': 'Eggs and egg products',
  '10.1': 'Fresh egg',
  '10.2': 'Egg products',
  '10.2.1': 'Liquid egg products',
  '10.2.2': 'Frozen egg products',
  '10.2.3': 'Dried and/or heat coagulated egg products',
  '10.3': 'Preserved eggs',
  '10.4': 'Egg based desserts (e.g. custard)',
  '11.0': 'Sweeteners including honey',
  '11.1': 'Refined and raw sugars',
  '11.1.1': 'White sugar, dextrose anhydrous, dextrose monohydrate, fructose',
  '11.1.2': 'Powdered sugar, powdered dextrose (icing sugar)',
  '11.1.3': 'Soft white sugar, soft brown sugar, glucose syrup, dried glucose syrup, raw cane sugar',
  '11.1.4': 'Lactose',
  '11.1.5': 'Plantation or mill white sugar',
  '11.1.6': 'Gur or Jaggery',
  '11.2': 'Brown sugar',
  '11.3': 'Sugar solutions and syrups',
  '11.4': 'Other sugars and syrups',
  '11.5': 'Honey',
  '11.6': 'Table-top sweeteners',
  '12.0': 'Salts, spices, soups, sauces, salads and protein products',
  '12.1': 'Salt and salt substitutes',
  '12.1.1': 'Salt (including edible common salt, iron fortified salt, iodized salt)',
  '12.1.2': 'Salt substitutes',
  '12.2': 'Herbs, spices, seasonings and condiments',
  '12.2.1': 'Herbs, spices, masalas, spice mixtures',
  '12.2.2': 'Seasonings and condiments',
  '12.3': 'Vinegars',
  '12.4': 'Mustards',
  '12.5': 'Soups and broths',
  '12.5.1': 'Ready-to-eat soups and broths',
  '12.5.2': 'Mixes for soups and broths',
  '12.6': 'Sauces and like products',
  '12.6.1': 'Emulsified sauces and dips (e.g. mayonnaise, salad dressings)',
  '12.6.2': 'Non emulsified sauces (e.g. ketchup, cheese sauce)',
  '12.6.3': 'Mixes for sauces and gravies',
  '12.6.4': 'Clear sauces',
  '12.7': 'Salads and sandwich spreads',
  '12.8': 'Yeast and like products',
  '12.9': 'Soybean-based seasonings and condiments',
  '12.9.1': 'Fermented soybean paste',
  '12.9.2': 'Soybean sauce',
  '12.9.2.1': 'Fermented soybean sauce',
  '12.9.2.2': 'Non-fermented soybean sauce',
  '12.9.2.3': 'Other soybean sauces',
  '13.0': 'Food stuffs intended for particular nutritional uses',
  '14.0': 'Beverages, excluding dairy products',
  '14.1': 'Non-alcoholic ("soft") beverages',
  '14.1.1': 'Waters',
  '14.1.1.1': 'Natural mineral waters and source waters',
  '14.1.1.2': 'Table waters and soda waters',
  '14.1.2': 'Fruit and vegetable juices',
  '14.1.2.1': 'Fruit juices',
  '15.0': 'Ready-to-eat savouries',
};

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIVE ALIAS MAP — Lab terminology → canonical FSSAI additive names
// Used for name normalization during matching.
// ─────────────────────────────────────────────────────────────────────────────

export const FSSAI_ADDITIVE_ALIASES: Record<string, string[]> = {
  'citric acid': ['citric acid', 'INS 330', 'E330', 'ins330', 'e 330'],
  'monosodium glutamate': ['MSG', 'monosodium glutamate', 'INS 621', 'e621', 'sodium glutamate'],
  'butylated hydroxyanisole': ['BHA', 'butylated hydroxyanisole', 'INS 320', 'e320'],
  'butylated hydroxytoluene': ['BHT', 'butylated hydroxytoluene', 'INS 321', 'e321'],
  'sodium benzoate': ['sodium benzoate', 'benzoic acid', 'INS 211', 'INS 210', 'e211', 'e210', 'benzoate'],
  'acesulfame potassium': ['acesulfame potassium', 'acesulfame K', 'INS 950', 'e950', 'ace-k'],
  'aspartame': ['aspartame', 'INS 951', 'e951'],
  'saccharin': ['saccharin', 'sodium saccharin', 'INS 954', 'e954'],
  'sucralose': ['sucralose', 'trichlorogalactosucrose', 'INS 955', 'e955'],
  'steviol glycosides': ['steviol glycosides', 'stevia', 'INS 960', 'e960', 'stevioside', 'rebaudioside'],
  'neotame': ['neotame', 'INS 961', 'e961'],
  'tartrazine': ['tartrazine', 'INS 102', 'e102', 'FD&C Yellow 5', 'yellow 5'],
  'sunset yellow fcf': ['sunset yellow FCF', 'sunset yellow', 'INS 110', 'e110', 'FD&C Yellow 6', 'yellow 6'],
  'carmoisine': ['carmoisine', 'azorubine', 'INS 122', 'e122'],
  'allura red ac': ['allura red AC', 'allura red', 'INS 129', 'e129', 'FD&C Red 40'],
  'erythrosine': ['erythrosine', 'INS 127', 'e127', 'FD&C Red 3'],
  'brilliant blue fcf': ['brilliant blue FCF', 'brilliant blue', 'INS 133', 'e133', 'FD&C Blue 1'],
  'indigotine': ['indigotine', 'indigo carmine', 'INS 132', 'e132', 'FD&C Blue 2'],
  'fast green fcf': ['fast green FCF', 'fast green', 'INS 143', 'e143', 'FD&C Green 3'],
  'ponceau 4r': ['ponceau 4R', 'ponceau', 'INS 124', 'e124'],
  'curcumin': ['curcumin', 'turmeric colour', 'INS 100', 'e100'],
  'annatto': ['annatto', 'bixin', 'norbixin', 'INS 160b', 'e160b', 'annatto extract'],
  'caramel': ['caramel colour', 'caramel color', 'plain caramel', 'INS 150a', 'INS 150c', 'INS 150d', 'e150'],
  'phosphates': ['phosphates', 'phosphoric acid', 'sodium phosphate', 'potassium phosphate', 'calcium phosphate', 'INS 339', 'INS 340', 'INS 341', 'INS 450', 'INS 451', 'INS 452', 'INS 338'],
  'sorbates': ['sorbates', 'sorbic acid', 'potassium sorbate', 'sodium sorbate', 'INS 200', 'INS 201', 'INS 202', 'e200', 'e202'],
  'benzoates': ['benzoates', 'benzoic acid', 'sodium benzoate', 'potassium benzoate', 'INS 210', 'INS 211', 'INS 212'],
  'sulfites': ['sulfites', 'sulphites', 'sulfur dioxide', 'sulphur dioxide', 'sodium metabisulfite', 'potassium metabisulfite', 'INS 220', 'INS 221', 'INS 222', 'INS 223', 'e220'],
  'polysorbates': ['polysorbates', 'polysorbate 20', 'polysorbate 60', 'polysorbate 80', 'INS 432', 'INS 433', 'INS 434', 'INS 435', 'INS 436'],
  'tbhq': ['TBHQ', 'tertiary butylhydroquinone', 'INS 319', 'e319', 'tert-butylhydroquinone'],
  'propyl gallate': ['propyl gallate', 'INS 310', 'e310'],
  'lecithins': ['lecithins', 'lecithin', 'soy lecithin', 'sunflower lecithin', 'INS 322', 'e322'],
  'carrageenan': ['carrageenan', 'carrageen', 'Irish moss', 'INS 407', 'e407'],
  'guar gum': ['guar gum', 'guar flour', 'INS 412', 'e412'],
  'xanthan gum': ['xanthan gum', 'xanthan', 'INS 415', 'e415'],
  'pectin': ['pectin', 'pectins', 'INS 440', 'e440'],
  'sodium nitrite': ['sodium nitrite', 'nitrites', 'INS 250', 'e250'],
  'sodium nitrate': ['sodium nitrate', 'potassium nitrate', 'nitrates', 'INS 251', 'INS 252', 'e251'],
  'nisin': ['nisin', 'INS 234', 'e234'],
  'natamycin': ['natamycin', 'pimaricin', 'INS 235', 'e235'],
  'calcium carbonate': ['calcium carbonate', 'chalk', 'INS 170', 'e170'],
  'silicon dioxide': ['silicon dioxide', 'silica', 'INS 551', 'e551'],
  'sodium aluminosilicate': ['sodium aluminosilicate', 'sodium aluminium silicate', 'INS 554', 'e554'],
  'tocopherols': ['tocopherols', 'vitamin E', 'alpha tocopherol', 'INS 307', 'e307'],
  'ascorbic acid': ['ascorbic acid', 'vitamin C', 'INS 300', 'e300'],
  'ascorbyl esters': ['ascorbyl esters', 'ascorbyl palmitate', 'ascorbyl stearate', 'INS 304', 'INS 305', 'e304', 'e305'],
  'hydroxypropyl methylcellulose': ['HPMC', 'hydroxypropyl methylcellulose', 'hydroxypropyl methyl cellulose', 'INS 464', 'e464'],
  'microcrystalline cellulose': ['microcrystalline cellulose', 'cellulose gel', 'MCC', 'INS 460', 'e460'],
  'mono and diglycerides': ['mono and diglycerides', 'monoglycerides', 'diglycerides', 'GMS', 'INS 471', 'e471'],
  'diacetyltartaric acid esters': ['DATEM', 'diacetyltartaric and fatty acid esters of glycerol', 'INS 472e', 'e472e'],
  'sodium stearoyl lactylate': ['sodium stearoyl lactylate', 'SSL', 'INS 481', 'e481'],
  'calcium stearoyl lactylate': ['calcium stearoyl lactylate', 'CSL', 'INS 482', 'e482'],
  'iron oxides': ['iron oxides', 'iron oxide', 'INS 172', 'e172'],
  'carotenoids': ['carotenoids', 'beta-carotene', 'beta carotene', 'INS 160a', 'e160a', 'carotene'],
  'riboflavins': ['riboflavins', 'riboflavin', 'vitamin B2', 'INS 101', 'e101'],
  'chlorophylls': ['chlorophylls', 'chlorophyll', 'INS 140', 'e140', 'chlorophyllin'],
  'propionic acid': ['propionic acid', 'sodium propionate', 'calcium propionate', 'INS 280', 'INS 281', 'INS 282', 'e282'],
  'ethylene diamine tetra acetates': ['EDTA', 'ethylene diamine tetra acetates', 'calcium disodium EDTA', 'INS 385', 'e385'],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Build rule records consistently
// ─────────────────────────────────────────────────────────────────────────────

function mkAdd(
  id: string,
  code: string,
  additive: string,
  aliases: string[],
  ins: string | null,
  max: string,
  unit: string,
  notes: string | null,
  page: string,
  table: string,
): FSSAIAdditiveRule {
  const isGmp = max.trim().toUpperCase() === 'GMP';
  const isNoAdd = max.trim().toUpperCase() === 'NO_ADDITIVES';
  return {
    id,
    food_category_code: code,
    food_category_name: FSSAI_FOOD_CATEGORY_CODES[code] ?? code,
    additive_name: additive,
    additive_aliases: aliases,
    ins_number: ins,
    maximum_level: max,
    unit: isGmp ? 'GMP' : isNoAdd ? 'NO_ADDITIVES' : unit,
    is_gmp: isGmp,
    no_additives_permitted: isNoAdd,
    notes,
    source_page: page,
    source_table: table,
    regulation_version: FSSAI_ADDITIVE_RULES_VERSION,
    active: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// "NO ADDITIVES PERMITTED" SENTINEL RULES
// When a category has no additives permitted, we store one sentinel record
// per category. The engine uses no_additives_permitted = true to flag any
// detected additive as NOT_PERMITTED.
// ─────────────────────────────────────────────────────────────────────────────

const NO_ADDITIVES_RULES: FSSAIAdditiveRule[] = [
  mkAdd('NAP-1.1.1', '1.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '547', 'Table 1'),
  mkAdd('NAP-1.1.1.1', '1.1.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '547', 'Table 1'),
  mkAdd('NAP-1.1.1.2', '1.1.1.2', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '547', 'Table 1'),
  mkAdd('NAP-1.2.1.1', '1.2.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '550', 'Table 1'),
  mkAdd('NAP-1.4.1', '1.4.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '557', 'Table 1'),
  mkAdd('NAP-4.1.1', '4.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '589', 'Table 4'),
  mkAdd('NAP-4.1.1.1', '4.1.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '589', 'Table 4'),
  mkAdd('NAP-4.2.1', '4.2.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '605', 'Table 4'),
  mkAdd('NAP-4.2.1.1', '4.2.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '605', 'Table 4'),
  mkAdd('NAP-6.1', '6.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '631', 'Table 6'),
  mkAdd('NAP-8.1', '8.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '655', 'Table 8'),
  mkAdd('NAP-8.1.1', '8.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '655', 'Table 8'),
  mkAdd('NAP-8.1.2', '8.1.2', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '655', 'Table 8'),
  mkAdd('NAP-9.1', '9.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '662', 'Table 9'),
  mkAdd('NAP-9.1.1', '9.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '662', 'Table 9'),
  mkAdd('NAP-10.1', '10.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '680', 'Table 10'),
  mkAdd('NAP-11.1', '11.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '685', 'Table 11'),
  mkAdd('NAP-11.1.4', '11.1.4', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '686', 'Table 11'),
  mkAdd('NAP-11.5', '11.5', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '690', 'Table 11'),
  mkAdd('NAP-12.1', '12.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '691', 'Table 12'),
  mkAdd('NAP-14.1.1', '14.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '704', 'Table 14'),
  mkAdd('NAP-14.1.1.1', '14.1.1.1', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '704', 'Table 14'),
  mkAdd('NAP-14.1.1.2', '14.1.1.2', 'No additives permitted', [], null, 'NO_ADDITIVES', 'NO_ADDITIVES', null, '704', 'Table 14'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 1: DAIRY PRODUCTS (pages 547–574)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE1_RULES: FSSAIAdditiveRule[] = [
  // 1.1.1.1 Milk (plain)
  mkAdd('T1-1.1.1.1-PHOS', '1.1.1.1', 'PHOSPHATES', ['phosphates', 'phosphoric acid', 'sodium phosphate'], null, '1500', 'mg/kg', '33, 227', '548', 'Table 1'),

  // 1.1.1.2 Buttermilk (plain)
  mkAdd('T1-1.1.1.2-PHOS', '1.1.1.2', 'PHOSPHATES', ['phosphates'], null, '1500', 'mg/kg', '33', '548', 'Table 1'),

  // 1.1.2 Dairy-based drinks — flavoured milk
  mkAdd('T1-1.1.2-ACE', '1.1.2', 'Acesulfame potassium', ['acesulfame potassium', 'acesulfame K', 'ace-k', 'INS 950'], '950', '350', 'mg/kg', '188', '548', 'Table 1'),
  mkAdd('T1-1.1.2-ALR', '1.1.2', 'Allura red AC', ['allura red', 'allura red AC', 'INS 129'], '129', '100', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-ASP', '1.1.2', 'Aspartame', ['aspartame', 'INS 951'], '951', '600', 'mg/kg', '191', '548', 'Table 1'),
  mkAdd('T1-1.1.2-ASPACE', '1.1.2', 'Aspartame-Acesulfame salt', ['aspartame-acesulfame salt', 'INS 962'], '962', '350', 'mg/kg', '113', '548', 'Table 1'),
  mkAdd('T1-1.1.2-BBF', '1.1.2', 'Brilliant blue FCF', ['brilliant blue FCF', 'brilliant blue', 'INS 133'], '133', '100', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-CAR', '1.1.2', 'CAROTENOIDS', ['carotenoids', 'beta-carotene', 'carotene'], null, '150', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-CUR', '1.1.2', 'Curcumin', ['curcumin', 'turmeric colour', 'INS 100'], '100', '100', 'mg/kg', null, '548', 'Table 1'),
  mkAdd('T1-1.1.2-CAN', '1.1.2', 'Canthaxanthin', ['canthaxanthin', 'INS 161g'], '161g', '15', 'mg/kg', '52, 170', '548', 'Table 1'),
  mkAdd('T1-1.1.2-CAR1', '1.1.2', 'Caramel color (plain)', ['caramel colour plain', 'caramel color plain', 'INS 150a'], '150a', 'GMP', 'GMP', null, '548', 'Table 1'),
  mkAdd('T1-1.1.2-CAR3', '1.1.2', 'Caramel III - ammonia caramel', ['caramel III', 'ammonia caramel', 'INS 150c'], '150c', '2000', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-CAR4', '1.1.2', 'Caramel IV - sulfite ammonia caramel', ['caramel IV', 'sulfite ammonia caramel', 'INS 150d'], '150d', '2000', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-ANN', '1.1.2', 'Annatto', ['annatto', 'bixin', 'norbixin', 'INS 160b'], '160b(i),(ii)', '100', 'mg/kg', null, '548', 'Table 1'),
  mkAdd('T1-1.1.2-BCAR', '1.1.2', 'beta-Carotenes, vegetable', ['beta carotene vegetable', 'INS 160a(ii)'], '160a(ii)', '1000', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-CHLO', '1.1.2', 'CHLOROPHYLLS AND CHLOROPHYLLINS, COPPER COMPLEXES', ['chlorophylls', 'chlorophyllin', 'copper complexes', 'INS 141'], null, '50', 'mg/kg', '190, 52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-DATE', '1.1.2', 'Diacetyltartaric and fatty acid esters of glycerol', ['DATEM', 'diacetyltartaric', 'INS 472e'], '472e', '5000', 'mg/kg', null, '548', 'Table 1'),
  mkAdd('T1-1.1.2-FGR', '1.1.2', 'Fast green FCF', ['fast green FCF', 'fast green', 'INS 143'], '143', '100', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-GRA', '1.1.2', 'Grape skin extract', ['grape skin extract', 'INS 163(ii)'], '163(ii)', '150', 'mg/kg', '181, 52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-IRO', '1.1.2', 'IRON OXIDES', ['iron oxides', 'iron oxide', 'INS 172'], null, '20', 'mg/kg', '52', '548', 'Table 1'),
  mkAdd('T1-1.1.2-IND', '1.1.2', 'Indigotine (Indigo carmine)', ['indigotine', 'indigo carmine', 'INS 132'], '132', '100', 'mg/kg', '52', '549', 'Table 1'),
  mkAdd('T1-1.1.2-NEO', '1.1.2', 'Neotame', ['neotame', 'INS 961'], '961', '20', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-PHOS', '1.1.2', 'PHOSPHATES', ['phosphates'], null, '1320', 'mg/kg', '33', '549', 'Table 1'),
  mkAdd('T1-1.1.2-POLY', '1.1.2', 'POLYSORBATES', ['polysorbates', 'polysorbate'], null, '3000', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-PON', '1.1.2', 'Ponceau 4R', ['ponceau 4R', 'ponceau', 'INS 124'], '124', '100', 'mg/kg', '52', '549', 'Table 1'),
  mkAdd('T1-1.1.2-CAR2', '1.1.2', 'Carmoisine', ['carmoisine', 'azorubine', 'INS 122'], '122', '100', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-ERY', '1.1.2', 'Erythrosine', ['erythrosine', 'INS 127'], '127', '50', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-TAR', '1.1.2', 'Tartrazine', ['tartrazine', 'INS 102'], '102', '100', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-PGE', '1.1.2', 'Propylene glycol esters of fatty acids', ['propylene glycol esters', 'PGE', 'INS 477'], '477', '5000', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-RIB', '1.1.2', 'RIBOFLAVINS', ['riboflavins', 'riboflavin', 'vitamin B2', 'INS 101'], null, '300', 'mg/kg', '52', '549', 'Table 1'),
  mkAdd('T1-1.1.2-SAC', '1.1.2', 'SACCHARINS', ['saccharins', 'saccharin', 'sodium saccharin', 'INS 954'], null, '80', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-SOR', '1.1.2', 'SORBATES', ['sorbates', 'sorbic acid', 'potassium sorbate', 'INS 200', 'INS 202'], null, '1000', 'mg/kg', '220, 42', '549', 'Table 1'),
  mkAdd('T1-1.1.2-STE', '1.1.2', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '200', 'mg/kg', '26, 201', '549', 'Table 1'),
  mkAdd('T1-1.1.2-SUC', '1.1.2', 'Sucralose', ['sucralose', 'trichlorogalactosucrose', 'INS 955'], '955', '300', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-SGC', '1.1.2', 'Sucroglycerides', ['sucroglycerides', 'INS 474'], '474', '5000', 'mg/kg', null, '549', 'Table 1'),
  mkAdd('T1-1.1.2-SYF', '1.1.2', 'Sunset yellow FCF', ['sunset yellow FCF', 'sunset yellow', 'INS 110'], '110', '100', 'mg/kg', '52', '549', 'Table 1'),
  mkAdd('T1-1.1.2-SAL', '1.1.2', 'Sodium aluminosilicate', ['sodium aluminosilicate', 'sodium aluminium silicate', 'INS 554'], '554', '60', 'mg/kg', '6, 253', '549', 'Table 1'),
  mkAdd('T1-1.1.2-HPMC', '1.1.2', 'Hydroxy propyl methyl cellulose', ['HPMC', 'hydroxypropyl methyl cellulose', 'INS 464'], '464', '7500', 'mg/kg', 'For flavoured milk only', '549', 'Table 1'),

  // 1.2 Fermented and renneted milk products (plain)
  mkAdd('T1-1.2-PHOS', '1.2', 'PHOSPHATES', ['phosphates'], null, '1000', 'mg/kg', '33', '549', 'Table 1'),

  // 1.2.1 Fermented milks (plain)
  mkAdd('T1-1.2.1-CAR4', '1.2.1', 'Caramel IV - sulfite ammonia caramel', ['caramel IV', 'INS 150d'], '150d', '150', 'mg/kg', '12', '550', 'Table 1'),

  // 1.2.1.2 Fermented milks heat treated
  mkAdd('T1-1.2.1.2-DATE', '1.2.1.2', 'Diacetyltartaric and fatty acid esters of glycerol', ['DATEM', 'INS 472e'], '472e', '5000', 'mg/kg', null, '550', 'Table 1'),
  mkAdd('T1-1.2.1.2-CAC', '1.2.1.2', 'Calcium carbonate', ['calcium carbonate', 'INS 170'], '170(i)', 'GMP', 'GMP', null, '551', 'Table 1'),
  mkAdd('T1-1.2.1.2-GUAN', '1.2.1.2', 'Guar gum', ['guar gum', 'INS 412'], '412', 'GMP', 'GMP', '234', '551', 'Table 1'),
  mkAdd('T1-1.2.1.2-XAN', '1.2.1.2', 'Xanthan gum', ['xanthan gum', 'INS 415'], '415', 'GMP', 'GMP', '234', '552', 'Table 1'),
  mkAdd('T1-1.2.1.2-CIT', '1.2.1.2', 'Citric acid', ['citric acid', 'INS 330'], '330', 'GMP', 'GMP', null, '552', 'Table 1'),
  mkAdd('T1-1.2.1.2-CURC', '1.2.1.2', 'Curcumin', ['curcumin', 'INS 100'], '100', '100', 'mg/kg', null, '552', 'Table 1'),
  mkAdd('T1-1.2.1.2-CAR1', '1.2.1.2', 'Caramel colour (Plain) Caramel I', ['caramel colour plain', 'INS 150a'], '150a', '150', 'mg/kg', null, '552', 'Table 1'),
  mkAdd('T1-1.2.1.2-TAR', '1.2.1.2', 'Tartrazine', ['tartrazine', 'INS 102'], '102', '100', 'mg/kg', null, '553', 'Table 1'),

  // 1.2.2 Renneted milk (plain)
  mkAdd('T1-1.2.2-CAR4', '1.2.2', 'Caramel IV - sulfite ammonia caramel', ['caramel IV', 'INS 150d'], '150d', 'GMP', 'GMP', null, '553', 'Table 1'),
  mkAdd('T1-1.2.2-DATE', '1.2.2', 'Diacetyltartaric and fatty acid esters of glycerol', ['DATEM', 'INS 472e'], '472e', '5000', 'mg/kg', null, '553', 'Table 1'),
  mkAdd('T1-1.2.2-SOR', '1.2.2', 'SORBATES', ['sorbates', 'sorbic acid', 'potassium sorbate'], null, '1000', 'mg/kg', '42', '553', 'Table 1'),

  // 1.3.1 Condensed milk, evaporated milk, sweetened condensed milk
  mkAdd('T1-1.3.1-CALC', '1.3.1', 'Calcium carbonate', ['calcium carbonate', 'INS 170'], '170(i)', '2000', 'mg/kg', 'Singly or 3000 mg/kg in combination', '555', 'Table 1'),
  mkAdd('T1-1.3.1-CARRAG', '1.3.1', 'Carrageenan', ['carrageenan', 'INS 407'], '407', '150', 'mg/kg', null, '556', 'Table 1'),
  mkAdd('T1-1.3.1-NISIN', '1.3.1', 'Nisin', ['nisin', 'INS 234'], '234', '12.5', 'mg/kg', 'Permitted in khoya only', '556', 'Table 1'),
  mkAdd('T1-1.3.1-PROP', '1.3.1', 'Propionic acid; sodium and calcium propionate', ['propionic acid', 'sodium propionate', 'calcium propionate', 'INS 280', 'INS 281', 'INS 282'], '280,281,282', '2000', 'mg/kg', 'Permitted in khoya only', '556', 'Table 1'),
  mkAdd('T1-1.3.1-SORB', '1.3.1', 'SORBATES', ['sorbates'], null, '2000', 'mg/kg', 'Permitted in khoya only', '556', 'Table 1'),

  // 1.3.2.1 Non dairy based beverage whitener
  mkAdd('T1-1.3.2.1-ACE', '1.3.2.1', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '2000', 'mg/kg', '188', '556', 'Table 1'),
  mkAdd('T1-1.3.2.1-ASP', '1.3.2.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '6000', 'mg/kg', '191', '556', 'Table 1'),
  mkAdd('T1-1.3.2.1-PHOS', '1.3.2.1', 'PHOSPHATES', ['phosphates'], null, '13000', 'mg/kg', '33', '557', 'Table 1'),
  mkAdd('T1-1.3.2.1-SUC', '1.3.2.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '580', 'mg/kg', null, '557', 'Table 1'),
  mkAdd('T1-1.3.2.1-TBHQ', '1.3.2.1', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'tert-butylhydroquinone', 'INS 319'], '319', '100', 'mg/kg', '15, 195', '557', 'Table 1'),

  // 1.4.2 Sterilized and UHT creams
  mkAdd('T1-1.4.2-PHOS', '1.4.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '557', 'Table 1'),
  mkAdd('T1-1.4.2-POLY', '1.4.2', 'POLYSORBATES', ['polysorbates'], null, '1000', 'mg/kg', null, '557', 'Table 1'),
  mkAdd('T1-1.4.2-DATE', '1.4.2', 'Diacetyltarteric and fatty acid esters of glycerol', ['DATEM', 'INS 472e'], '472e', '6000', 'mg/kg', null, '558', 'Table 1'),
  mkAdd('T1-1.4.2-XAN', '1.4.2', 'Xanthan gum', ['xanthan gum', 'INS 415'], '415', 'GMP', 'GMP', null, '560', 'Table 1'),

  // 1.4.3 Clotted cream (plain)
  mkAdd('T1-1.4.3-DATE', '1.4.3', 'Diacetyltartaric and fatty acid esters of glycerol', ['DATEM', 'INS 472e'], '472e', '5000', 'mg/kg', null, '560', 'Table 1'),
  mkAdd('T1-1.4.3-NIS', '1.4.3', 'Nisin', ['nisin', 'INS 234'], '234', '10', 'mg/kg', null, '560', 'Table 1'),
  mkAdd('T1-1.4.3-PHOS', '1.4.3', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '560', 'Table 1'),
  mkAdd('T1-1.4.3-POLY', '1.4.3', 'POLYSORBATES', ['polysorbates'], null, '1000', 'mg/kg', null, '560', 'Table 1'),

  // 1.4.4 Cream analogues
  mkAdd('T1-1.4.4-ACE', '1.4.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '560', 'Table 1'),
  mkAdd('T1-1.4.4-ASP', '1.4.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '560', 'Table 1'),
  mkAdd('T1-1.4.4-PHOS', '1.4.4', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '561', 'Table 1'),
  mkAdd('T1-1.4.4-POLY', '1.4.4', 'POLYSORBATES', ['polysorbates'], null, '5000', 'mg/kg', null, '561', 'Table 1'),
  mkAdd('T1-1.4.4-SUC', '1.4.4', 'Sucralose', ['sucralose', 'INS 955'], '955', '580', 'mg/kg', null, '561', 'Table 1'),
  mkAdd('T1-1.4.4-NEO', '1.4.4', 'Neotame', ['neotame', 'INS 961'], '961', '33', 'mg/kg', null, '560', 'Table 1'),

  // 1.5.1 Milk powder and cream powder (plain)
  mkAdd('T1-1.5.1-ASCE', '1.5.1', 'ASCORBYL ESTERS', ['ascorbyl esters', 'ascorbyl palmitate', 'INS 304', 'INS 305'], null, '500', 'mg/kg', '10', '561', 'Table 1'),
  mkAdd('T1-1.5.1-BHA', '1.5.1', 'Butylated hydroxyanisole (BHA)', ['BHA', 'butylated hydroxyanisole', 'INS 320'], '320', '100', 'mg/kg', '15, 196', '561', 'Table 1'),
  mkAdd('T1-1.5.1-BHT', '1.5.1', 'Butylated hydroxytoluene (BHT)', ['BHT', 'butylated hydroxytoluene', 'INS 321'], '321', '200', 'mg/kg', '15, 196', '561', 'Table 1'),
  mkAdd('T1-1.5.1-PHOS', '1.5.1', 'PHOSPHATES', ['phosphates'], null, '3000', 'mg/kg', '33', '561', 'Table 1'),

  // 1.5.2 Powder analogues
  mkAdd('T1-1.5.2-ACE', '1.5.2', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '562', 'Table 1'),
  mkAdd('T1-1.5.2-ASP', '1.5.2', 'Aspartame', ['aspartame', 'INS 951'], '951', '2000', 'mg/kg', '191', '562', 'Table 1'),
  mkAdd('T1-1.5.2-PHOS', '1.5.2', 'PHOSPHATES', ['phosphates'], null, '4400', 'mg/kg', '52[88, 33]', '562', 'Table 1'),
  mkAdd('T1-1.5.2-STE', '1.5.2', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '330', 'mg/kg', '26, 201', '562', 'Table 1'),
  mkAdd('T1-1.5.2-NEO', '1.5.2', 'Neotame', ['neotame', 'INS 961'], '961', '65', 'mg/kg', null, '562', 'Table 1'),

  // 1.6.1 Unripened cheese
  mkAdd('T1-1.6.1-ASP', '1.6.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '562', 'Table 1'),
  mkAdd('T1-1.6.1-CAN', '1.6.1', 'Canthaxanthin', ['canthaxanthin', 'INS 161g'], '161g', '15', 'mg/kg', '201', '563', 'Table 1'),
  mkAdd('T1-1.6.1-NAT', '1.6.1', 'Natamycin (Pimaricin)', ['natamycin', 'pimaricin', 'INS 235'], '235', '40', 'mg/kg', '80, 3', '563', 'Table 1'),
  mkAdd('T1-1.6.1-PHOS', '1.6.1', 'PHOSPHATES', ['phosphates'], null, '4400', 'mg/kg', '33', '563', 'Table 1'),
  mkAdd('T1-1.6.1-SOR', '1.6.1', 'SORBATES', ['sorbates'], null, '2000', 'mg/kg', '42, 223 (for channa and paneer only)', '563', 'Table 1'),
  mkAdd('T1-1.6.1-NIS', '1.6.1', 'Nisin', ['nisin', 'INS 234'], '234', '12.5', 'mg/kg', 'for channa and paneer only', '563', 'Table 1'),
  mkAdd('T1-1.6.1-PROP', '1.6.1', 'Propionic acid and propionates', ['propionic acid', 'sodium propionate', 'calcium propionate', 'INS 280', 'INS 281', 'INS 282'], '280,281,282,283', '3000', 'mg/kg', 'for channa and paneer only', '563', 'Table 1'),

  // 1.6.2 Ripened cheese
  mkAdd('T1-1.6.2-NIS', '1.6.2', 'Nisin', ['nisin', 'INS 234'], '234', '12', 'mg/kg', null, '564', 'Table 1'),
  mkAdd('T1-1.6.2-NAT', '1.6.2', 'Natamycin (Pimaricin)', ['natamycin', 'pimaricin', 'INS 235'], '235', '40', 'mg/kg', '3, 80', '564', 'Table 1'),
  mkAdd('T1-1.6.2-SOR', '1.6.2', 'SORBATES', ['sorbates'], null, '3000', 'mg/kg', '42', '564', 'Table 1'),
  mkAdd('T1-1.6.2-PROP', '1.6.2', 'Propionic acid and propionates', ['propionic acid', 'sodium propionate', 'calcium propionate'], '280,281,282,283', '3000', 'mg/kg', 'Singly or in combination expressed as propionic acid', '565', 'Table 1'),

  // 1.6.4.1 Plain processed cheese
  mkAdd('T1-1.6.4.1-PHOS', '1.6.4.1', 'PHOSPHATES', ['phosphates'], null, '9000', 'mg/kg', '69[33]', '568', 'Table 1'),
  mkAdd('T1-1.6.4.1-SOR', '1.6.4.1', 'SORBATES', ['sorbates'], null, '3000', 'mg/kg', '42', '568', 'Table 1'),
  mkAdd('T1-1.6.4.1-NIS', '1.6.4.1', 'Nisin', ['nisin', 'INS 234'], '234', '12.5', 'mg/kg', null, '568', 'Table 1'),

  // 1.6.5 Cheese analogues
  mkAdd('T1-1.6.5-PHOS', '1.6.5', 'PHOSPHATES', ['phosphates'], null, '9000', 'mg/kg', null, '570', 'Table 1'),
  mkAdd('T1-1.6.5-SOR', '1.6.5', 'SORBATES', ['sorbates'], null, '3000', 'mg/kg', '42', '570', 'Table 1'),
  mkAdd('T1-1.6.5-NIS', '1.6.5', 'Nisin', ['nisin', 'INS 234'], '234', '12', 'mg/kg', null, '570', 'Table 1'),
  mkAdd('T1-1.6.5-ACE', '1.6.5', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', '188', '569', 'Table 1'),
  mkAdd('T1-1.6.5-ASP', '1.6.5', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '569', 'Table 1'),
  mkAdd('T1-1.6.5-SUC', '1.6.5', 'Sucralose', ['sucralose', 'INS 955'], '955', '500', 'mg/kg', null, '570', 'Table 1'),

  // 1.7 Dairy based desserts
  mkAdd('T1-1.7-BEN', '1.7', 'BENZOATES', ['benzoates', 'sodium benzoate', 'benzoic acid', 'INS 210', 'INS 211'], null, '300', 'mg/kg', '13', '571', 'Table 1'),
  mkAdd('T1-1.7-ACE', '1.7', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', '188', '571', 'Table 1'),
  mkAdd('T1-1.7-ASP', '1.7', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '571', 'Table 1'),
  mkAdd('T1-1.7-PHOS', '1.7', 'PHOSPHATES', ['phosphates'], null, '1500', 'mg/kg', null, '572', 'Table 1'),
  mkAdd('T1-1.7-SOR', '1.7', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '572', 'Table 1'),
  mkAdd('T1-1.7-SUC', '1.7', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', null, '572', 'Table 1'),
  mkAdd('T1-1.7-STE', '1.7', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '330', 'mg/kg', '26', '572', 'Table 1'),

  // 1.8.1 Liquid whey
  mkAdd('T1-1.8.1-PHOS', '1.8.1', 'PHOSPHATES', ['phosphates'], null, '880', 'mg/kg', '33, 228', '573', 'Table 1'),

  // 1.8.2 Dried whey
  mkAdd('T1-1.8.2-PHOS', '1.8.2', 'PHOSPHATES', ['phosphates'], null, '4400', 'mg/kg', '33', '574', 'Table 1'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 2: FATS AND OILS (pages 575–585)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE2_RULES: FSSAIAdditiveRule[] = [
  // 2.1.1 Butter oil, anhydrous milk fat and ghee — note: no additives in ghee
  mkAdd('T2-2.1.1-BHA', '2.1.1', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '175', 'mg/kg', '15, 171, 133', '575', 'Table 2'),
  mkAdd('T2-2.1.1-BHT', '2.1.1', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '75', 'mg/kg', '15, 171, 133', '575', 'Table 2'),
  mkAdd('T2-2.1.1-PG', '2.1.1', 'Propyl gallate', ['propyl gallate', 'INS 310'], '310', '100', 'mg/kg', '15, 133, 171', '575', 'Table 2'),
  mkAdd('T2-2.1.1-CIT', '2.1.1', 'Citric acid', ['citric acid', 'INS 330'], '330', 'GMP', 'GMP', '171', '575', 'Table 2'),

  // 2.1.2 Vegetable oils, fats and bakery shortenings
  mkAdd('T2-2.1.2-BHA', '2.1.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '130, 15', '575', 'Table 2'),
  mkAdd('T2-2.1.2-BHT', '2.1.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '130, 15', '575', 'Table 2'),
  mkAdd('T2-2.1.2-PG', '2.1.2', 'Propyl gallate', ['propyl gallate', 'INS 310'], '310', '200', 'mg/kg', '15, 130', '575', 'Table 2'),
  mkAdd('T2-2.1.2-TBHQ', '2.1.2', 'TBHQ', ['TBHQ', 'tert-butylhydroquinone', 'INS 319'], '319', '200', 'mg/kg', '15, 130', '576', 'Table 2'),
  mkAdd('T2-2.1.2-LEC', '2.1.2', 'Lecithins', ['lecithins', 'lecithin', 'soy lecithin', 'INS 322'], '322(i),(ii)', 'GMP', 'GMP', null, '575', 'Table 2'),

  // 2.2.1 Butter
  mkAdd('T2-2.2.1-CUR', '2.2.1', 'Curcumin', ['curcumin', 'INS 100'], '100', '100', 'mg/kg', null, '578', 'Table 2'),
  mkAdd('T2-2.2.1-BCAR', '2.2.1', 'beta-Carotenes, vegetable', ['beta carotene vegetable', 'INS 160a(ii)'], '160a(ii)', '600', 'mg/kg', null, '578', 'Table 2'),
  mkAdd('T2-2.2.1-ANN', '2.2.1', 'Annatto', ['annatto', 'bixin', 'INS 160b'], '160b(i),(ii)', '20', 'mg/kg', '8', '578', 'Table 2'),
  mkAdd('T2-2.2.1-PHOS', '2.2.1', 'PHOSPHATES', ['phosphates'], null, '880', 'mg/kg', '33, 34', '579', 'Table 2'),

  // 2.2.2 Fat spreads, dairy fat spreads and blended spreads (margarine)
  mkAdd('T2-2.2.2-BHA', '2.2.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '130, 15', '579', 'Table 2'),
  mkAdd('T2-2.2.2-BHT', '2.2.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '130, 15', '579', 'Table 2'),
  mkAdd('T2-2.2.2-TBHQ', '2.2.2', 'TBHQ', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '15, 130', '579', 'Table 2'),
  mkAdd('T2-2.2.2-SOR', '2.2.2', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '579', 'Table 2'),
  mkAdd('T2-2.2.2-BEN', '2.2.2', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '1000', 'mg/kg', '13', '580', 'Table 2'),
  mkAdd('T2-2.2.2-PHOS', '2.2.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '580', 'Table 2'),
  mkAdd('T2-2.2.2-EDTA', '2.2.2', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA', 'calcium disodium EDTA', 'INS 385'], null, '50', 'mg/kg', '21', '580', 'Table 2'),

  // 2.3 Fat emulsions mainly of type oil-in-water
  mkAdd('T2-2.3-ACE', '2.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '581', 'Table 2'),
  mkAdd('T2-2.3-ASP', '2.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '581', 'Table 2'),
  mkAdd('T2-2.3-BHA', '2.3', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '130, 15', '581', 'Table 2'),
  mkAdd('T2-2.3-BHT', '2.3', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '130, 15', '581', 'Table 2'),
  mkAdd('T2-2.3-PHOS', '2.3', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '582', 'Table 2'),
  mkAdd('T2-2.3-SOR', '2.3', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '582', 'Table 2'),
  mkAdd('T2-2.3-TBHQ', '2.3', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '15, 130', '582', 'Table 2'),

  // 2.4.1 Cocoa based spreads including fillings
  mkAdd('T2-2.4.1-ACE', '2.4.1', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '585', 'Table 2'),
  mkAdd('T2-2.4.1-ASP', '2.4.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '3000', 'mg/kg', '191', '585', 'Table 2'),
  mkAdd('T2-2.4.1-BEN', '2.4.1', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '1500', 'mg/kg', '13', '585', 'Table 2'),
  mkAdd('T2-2.4.1-PHOS', '2.4.1', 'PHOSPHATES', ['phosphates'], null, '880', 'mg/kg', '33', '585', 'Table 2'),
  mkAdd('T2-2.4.1-SUC', '2.4.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', '169', '585', 'Table 2'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 3: EDIBLE ICES, INCLUDING SORBET (pages 586–588)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE3_RULES: FSSAIAdditiveRule[] = [
  mkAdd('T3-3.0-ACE', '3.0', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '800', 'mg/kg', '188', '586', 'Table 3'),
  mkAdd('T3-3.0-ASP', '3.0', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '586', 'Table 3'),
  mkAdd('T3-3.0-BHA', '3.0', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '195, 15', '586', 'Table 3'),
  mkAdd('T3-3.0-BHT', '3.0', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '100', 'mg/kg', '195, 15', '586', 'Table 3'),
  mkAdd('T3-3.0-CAR4', '3.0', 'Caramel IV - sulfite ammonia caramel', ['caramel IV', 'INS 150d'], '150d', '3000', 'mg/kg', null, '586', 'Table 3'),
  mkAdd('T3-3.0-PHOS', '3.0', 'PHOSPHATES', ['phosphates'], null, '7500', 'mg/kg', '33', '587', 'Table 3'),
  mkAdd('T3-3.0-SAC', '3.0', 'SACCHARINS', ['saccharins', 'saccharin'], null, '100', 'mg/kg', null, '587', 'Table 3'),
  mkAdd('T3-3.0-SUC', '3.0', 'Sucralose', ['sucralose', 'INS 955'], '955', '320', 'mg/kg', null, '587', 'Table 3'),
  mkAdd('T3-3.0-STE', '3.0', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '170', 'mg/kg', '26', '588', 'Table 3'),
  mkAdd('T3-3.0-TBHQ', '3.0', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', null, '587', 'Table 3'),
  mkAdd('T3-3.0-TAR', '3.0', 'Tartrazine', ['tartrazine', 'INS 102'], '102', '100', 'mg/kg', null, '588', 'Table 3'),
  mkAdd('T3-3.0-CUR', '3.0', 'Curcumin', ['curcumin', 'INS 100'], '100', '100', 'mg/kg', null, '588', 'Table 3'),
  mkAdd('T3-3.0-ANN', '3.0', 'Annatto', ['annatto', 'INS 160b'], '160b', '100', 'mg/kg', null, '588', 'Table 3'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 4: FRUITS AND VEGETABLES (pages 589–615)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE4_RULES: FSSAIAdditiveRule[] = [
  // 4.1.1.2 Surface-treated fresh fruits
  mkAdd('T4-4.1.1.2-SUL', '4.1.1.2', 'SULFITES', ['sulfites', 'sulphites', 'sulfur dioxide', 'INS 220'], null, '30', 'mg/kg', null, '589', 'Table 4'),

  // 4.1.2 Processed fruits
  mkAdd('T4-4.1.2-SUL', '4.1.2', 'SULFITES', ['sulfites', 'sulphites'], null, '500', 'mg/kg', null, '590', 'Table 4'),

  // 4.1.2.1 Frozen fruits
  mkAdd('T4-4.1.2.1-SUL', '4.1.2.1', 'SULFITES', ['sulfites'], null, '500', 'mg/kg', '44, 155', '590', 'Table 4'),

  // 4.1.2.2 Dried fruits, nuts and seeds
  mkAdd('T4-4.1.2.2-BEN', '4.1.2.2', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '800', 'mg/kg', '13', '590', 'Table 4'),
  mkAdd('T4-4.1.2.2-SOR', '4.1.2.2', 'SORBATES', ['sorbates'], null, '500', 'mg/kg', '42', '591', 'Table 4'),
  mkAdd('T4-4.1.2.2-SUL', '4.1.2.2', 'SULFITES', ['sulfites', 'sulphites'], null, '1000', 'mg/kg', '44, 135, 218', '591', 'Table 4'),

  // 4.1.2.3 Fruit in vinegar, oil, or brine
  mkAdd('T4-4.1.2.3-ACE', '4.1.2.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '200', 'mg/kg', '188', '591', 'Table 4'),
  mkAdd('T4-4.1.2.3-ASP', '4.1.2.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '300', 'mg/kg', '144, 191', '591', 'Table 4'),
  mkAdd('T4-4.1.2.3-BEN', '4.1.2.3', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '250', 'mg/kg', '13', '591', 'Table 4'),
  mkAdd('T4-4.1.2.3-SOR', '4.1.2.3', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '592', 'Table 4'),
  mkAdd('T4-4.1.2.3-SUC', '4.1.2.3', 'Sucralose', ['sucralose', 'INS 955'], '955', '180', 'mg/kg', '144', '592', 'Table 4'),

  // 4.1.2.4 Canned or bottled (pasteurized) fruit
  mkAdd('T4-4.1.2.4-ACE', '4.1.2.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', '188', '592', 'Table 4'),
  mkAdd('T4-4.1.2.4-ASP', '4.1.2.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '592', 'Table 4'),
  mkAdd('T4-4.1.2.4-STE', '4.1.2.4', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '100', 'mg/kg', '26', '593', 'Table 4'),
  mkAdd('T4-4.1.2.4-SUC', '4.1.2.4', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', null, '593', 'Table 4'),

  // 4.1.2.5 Jams, jellies, marmalades
  mkAdd('T4-4.1.2.5-ACE', '4.1.2.5', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '593', 'Table 4'),
  mkAdd('T4-4.1.2.5-ASP', '4.1.2.5', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '593', 'Table 4'),
  mkAdd('T4-4.1.2.5-BEN', '4.1.2.5', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '1000', 'mg/kg', '13', '593', 'Table 4'),
  mkAdd('T4-4.1.2.5-SOR', '4.1.2.5', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '595', 'Table 4'),
  mkAdd('T4-4.1.2.5-STE', '4.1.2.5', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '360', 'mg/kg', '26', '595', 'Table 4'),
  mkAdd('T4-4.1.2.5-SUC', '4.1.2.5', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', null, '595', 'Table 4'),
  mkAdd('T4-4.1.2.5-SUL', '4.1.2.5', 'SULFITES', ['sulfites'], null, '100', 'mg/kg', '44', '595', 'Table 4'),

  // 4.1.2.8 Fruit preparations
  mkAdd('T4-4.1.2.8-BEN', '4.1.2.8', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '1000', 'mg/kg', '13', '598', 'Table 4'),
  mkAdd('T4-4.1.2.8-SOR', '4.1.2.8', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '599', 'Table 4'),
  mkAdd('T4-4.1.2.8-STE', '4.1.2.8', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '330', 'mg/kg', '26', '599', 'Table 4'),
  mkAdd('T4-4.1.2.8-SUL', '4.1.2.8', 'SULFITES', ['sulfites'], null, '100', 'mg/kg', '206, 44', '599', 'Table 4'),

  // 4.2.1.2 Surface treated fresh vegetables
  mkAdd('T4-4.2.1.2-PHOS', '4.2.1.2', 'PHOSPHATES', ['phosphates'], null, '1760', 'mg/kg', '33', '605', 'Table 4'),

  // 4.2.2 Processed vegetables
  mkAdd('T4-4.2.2-PHOS', '4.2.2', 'PHOSPHATES', ['phosphates'], null, '5000', 'mg/kg', '33, 76', '606', 'Table 4'),
  mkAdd('T4-4.2.2-SUL', '4.2.2', 'SULFITES', ['sulfites'], null, '50', 'mg/kg', '44, 76, 136, 137', '606', 'Table 4'),
  mkAdd('T4-4.2.2-CIT', '4.2.2', 'Citric acid', ['citric acid', 'INS 330'], '330', 'GMP', 'GMP', '242, 262, 264, 265', '606', 'Table 4'),

  // 4.2.2.2 Dried vegetables
  mkAdd('T4-4.2.2.2-BEN', '4.2.2.2', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '607', 'Table 4'),
  mkAdd('T4-4.2.2.2-BHA', '4.2.2.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '196, 15, 76', '607', 'Table 4'),
  mkAdd('T4-4.2.2.2-BHT', '4.2.2.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '196, 15, 76', '607', 'Table 4'),
  mkAdd('T4-4.2.2.2-SUL', '4.2.2.2', 'SULFITES', ['sulfites'], null, '500', 'mg/kg', '44, 105', '608', 'Table 4'),

  // 4.2.2.3 Vegetables in vinegar, oil, brine
  mkAdd('T4-4.2.2.3-ACE', '4.2.2.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '200', 'mg/kg', '144, 188', '608', 'Table 4'),
  mkAdd('T4-4.2.2.3-ASP', '4.2.2.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '300', 'mg/kg', '144, 191', '608', 'Table 4'),
  mkAdd('T4-4.2.2.3-BEN', '4.2.2.3', 'BENZOATES', ['benzoates'], null, '2000', 'mg/kg', '13', '608', 'Table 4'),
  mkAdd('T4-4.2.2.3-SOR', '4.2.2.3', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '609', 'Table 4'),
  mkAdd('T4-4.2.2.3-SUL', '4.2.2.3', 'SULFITES', ['sulfites'], null, '100', 'mg/kg', '44', '609', 'Table 4'),

  // 4.2.2.5 Vegetable purees and spreads
  mkAdd('T4-4.2.2.5-STE', '4.2.2.5', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '330', 'mg/kg', '26', '611', 'Table 4'),
  mkAdd('T4-4.2.2.5-SUL', '4.2.2.5', 'SULFITES', ['sulfites'], null, '500', 'mg/kg', '44, 138', '611', 'Table 4'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 5: CONFECTIONERY (pages 616–630)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE5_RULES: FSSAIAdditiveRule[] = [
  // 5.1.1 Cocoa mixes (powders) and cocoa mass/cake
  mkAdd('T5-5.1.1-ACE', '5.1.1', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', '188', '616', 'Table 5'),
  mkAdd('T5-5.1.1-ASP', '5.1.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '3000', 'mg/kg', '191', '616', 'Table 5'),
  mkAdd('T5-5.1.1-BEN', '5.1.1', 'BENZOATES', ['benzoates'], null, '1500', 'mg/kg', null, '616', 'Table 5'),
  mkAdd('T5-5.1.1-SOR', '5.1.1', 'SORBATES', ['sorbates'], null, '1500', 'mg/kg', null, '616', 'Table 5'),
  mkAdd('T5-5.1.1-PHOS', '5.1.1', 'PHOSPHATES', ['phosphates'], null, '1100', 'mg/kg', '33', '616', 'Table 5'),
  mkAdd('T5-5.1.1-SUC', '5.1.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '580', 'mg/kg', '97', '616', 'Table 5'),

  // 5.1.3 Cocoa and chocolate products
  mkAdd('T5-5.1.3-ACE', '5.1.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '617', 'Table 5'),
  mkAdd('T5-5.1.3-ASP', '5.1.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '3000', 'mg/kg', '191', '617', 'Table 5'),
  mkAdd('T5-5.1.3-BHA', '5.1.3', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '130, 141, 15', '618', 'Table 5'),
  mkAdd('T5-5.1.3-BHT', '5.1.3', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '130, 141, 15', '618', 'Table 5'),
  mkAdd('T5-5.1.3-TBHQ', '5.1.3', 'TBHQ', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '15, 130, 141', '618', 'Table 5'),
  mkAdd('T5-5.1.3-BEN', '5.1.3', 'BENZOATES', ['benzoates'], null, '1500', 'mg/kg', null, '619', 'Table 5'),
  mkAdd('T5-5.1.3-PHOS', '5.1.3', 'PHOSPHATES', ['phosphates'], null, '2500', 'mg/kg', '33', '619', 'Table 5'),
  mkAdd('T5-5.1.3-SUC', '5.1.3', 'Sucralose', ['sucralose', 'INS 955'], '955', '800', 'mg/kg', null, '619', 'Table 5'),
  mkAdd('T5-5.1.3-SOR', '5.1.3', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '618', 'Table 5'),

  // 5.2 Confectionery (candy, nougats)
  mkAdd('T5-5.2-BEN', '5.2', 'BENZOATES', ['benzoates'], null, '1500', 'mg/kg', '13', '621', 'Table 5'),
  mkAdd('T5-5.2-BHA', '5.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '130, 15', '621', 'Table 5'),
  mkAdd('T5-5.2-BHT', '5.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '130, 15', '621', 'Table 5'),
  mkAdd('T5-5.2-PHOS', '5.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '623', 'Table 5'),
  mkAdd('T5-5.2-SAC', '5.2', 'SACCHARINS', ['saccharins', 'saccharin'], null, '500', 'mg/kg', '163', '623', 'Table 5'),
  mkAdd('T5-5.2-SOR', '5.2', 'SORBATES', ['sorbates'], null, '1500', 'mg/kg', '42', '623', 'Table 5'),
  mkAdd('T5-5.2-STE', '5.2', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '700', 'mg/kg', '26, 199', '623', 'Table 5'),
  mkAdd('T5-5.2-SUC', '5.2', 'Sucralose', ['sucralose', 'INS 955'], '955', '1800', 'mg/kg', null, '623', 'Table 5'),
  mkAdd('T5-5.2-TBHQ', '5.2', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '15, 130', '623', 'Table 5'),

  // 5.2.1 Hard candy
  mkAdd('T5-5.2.1-ACE', '5.2.1', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '3500', 'mg/kg', '188', '624', 'Table 5'),
  mkAdd('T5-5.2.1-ASP', '5.2.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '10000', 'mg/kg', null, '624', 'Table 5'),
  mkAdd('T5-5.2.1-SUC', '5.2.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '1500', 'mg/kg', '164', '624', 'Table 5'),

  // 5.3 Chewing gum
  mkAdd('T5-5.3-ACE', '5.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '5000', 'mg/kg', null, '626', 'Table 5'),
  mkAdd('T5-5.3-ASP', '5.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '10000', 'mg/kg', null, '626', 'Table 5'),
  mkAdd('T5-5.3-BEN', '5.3', 'BENZOATES', ['benzoates'], null, '1500', 'mg/kg', null, '626', 'Table 5'),
  mkAdd('T5-5.3-BHA', '5.3', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '400', 'mg/kg', '130', '626', 'Table 5'),
  mkAdd('T5-5.3-BHT', '5.3', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '400', 'mg/kg', '130', '626', 'Table 5'),
  mkAdd('T5-5.3-PHOS', '5.3', 'PHOSPHATES', ['phosphates'], null, '44000', 'mg/kg', '33', '628', 'Table 5'),
  mkAdd('T5-5.3-SAC', '5.3', 'SACCHARINS', ['saccharins', 'saccharin'], null, '2500', 'mg/kg', null, '628', 'Table 5'),
  mkAdd('T5-5.3-SOR', '5.3', 'SORBATES', ['sorbates'], null, '1500', 'mg/kg', '42', '628', 'Table 5'),
  mkAdd('T5-5.3-STE', '5.3', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '3500', 'mg/kg', '26', '628', 'Table 5'),
  mkAdd('T5-5.3-SUC', '5.3', 'Sucralose', ['sucralose', 'INS 955'], '955', '5000', 'mg/kg', null, '628', 'Table 5'),
  mkAdd('T5-5.3-TBHQ', '5.3', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '400', 'mg/kg', '130', '628', 'Table 5'),

  // 5.4 Decorations, toppings and sweet sauces
  mkAdd('T5-5.4-ACE', '5.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '500', 'mg/kg', null, '628', 'Table 5'),
  mkAdd('T5-5.4-ASP', '5.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', null, '628', 'Table 5'),
  mkAdd('T5-5.4-BEN', '5.4', 'BENZOATES', ['benzoates'], null, '1500', 'mg/kg', null, '628', 'Table 5'),
  mkAdd('T5-5.4-PHOS', '5.4', 'PHOSPHATES', ['phosphates'], null, '1500', 'mg/kg', '33', '629', 'Table 5'),
  mkAdd('T5-5.4-SAC', '5.4', 'SACCHARINS', ['saccharins', 'saccharin'], null, '500', 'mg/kg', null, '630', 'Table 5'),
  mkAdd('T5-5.4-SOR', '5.4', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '629', 'Table 5'),
  mkAdd('T5-5.4-SUC', '5.4', 'Sucralose', ['sucralose', 'INS 955'], '955', '1000', 'mg/kg', null, '630', 'Table 5'),
  mkAdd('T5-5.4-TBHQ', '5.4', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', null, '630', 'Table 5'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 6: CEREALS AND CEREAL PRODUCTS (pages 631–644)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE6_RULES: FSSAIAdditiveRule[] = [
  // 6.2.1/6.2.2 Flours and starches (no additives in Atta)
  mkAdd('T6-6.2-SUL', '6.2', 'SULFITES', ['sulfites'], null, '200', 'mg/kg', '44', '632', 'Table 6'),
  mkAdd('T6-6.2-PHOS', '6.2', 'PHOSPHATES', ['phosphates'], null, '2500', 'mg/kg', '225, 33', '632', 'Table 6'),
  mkAdd('T6-6.2-ASC', '6.2', 'L-Ascorbic acid', ['ascorbic acid', 'vitamin C', 'INS 300'], '300', '300', 'mg/kg', null, '632', 'Table 6'),

  // 6.3 Ready-to-eat cereals, breakfast cereals
  mkAdd('T6-6.3-ACE', '6.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1200', 'mg/kg', '188', '633', 'Table 6'),
  mkAdd('T6-6.3-ASP', '6.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '633', 'Table 6'),
  mkAdd('T6-6.3-BHA', '6.3', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '196, 15', '633', 'Table 6'),
  mkAdd('T6-6.3-BHT', '6.3', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '100', 'mg/kg', '196, 15', '633', 'Table 6'),
  mkAdd('T6-6.3-PHOS', '6.3', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '634', 'Table 6'),
  mkAdd('T6-6.3-SAC', '6.3', 'SACCHARINS', ['saccharins'], null, '100', 'mg/kg', null, '634', 'Table 6'),
  mkAdd('T6-6.3-STE', '6.3', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '350', 'mg/kg', '26', '634', 'Table 6'),
  mkAdd('T6-6.3-SUC', '6.3', 'Sucralose', ['sucralose', 'INS 955'], '955', '1000', 'mg/kg', null, '634', 'Table 6'),

  // 6.4.1 Fresh pastas and noodles
  mkAdd('T6-6.4.1-PHOS', '6.4.1', 'PHOSPHATES', ['phosphates'], null, '2500', 'mg/kg', '211, 33', '635', 'Table 6'),
  mkAdd('T6-6.4.1-CIT', '6.4.1', 'Citric acid', ['citric acid', 'INS 330'], '330', 'GMP', 'GMP', null, '635', 'Table 6'),

  // 6.4.2 Dried pastas and noodles
  mkAdd('T6-6.4.2-PHOS', '6.4.2', 'PHOSPHATES', ['phosphates'], null, '900', 'mg/kg', '211, 33', '636', 'Table 6'),

  // 6.4.3 Pre-cooked pastas and noodles
  mkAdd('T6-6.4.3-BEN', '6.4.3', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '638', 'Table 6'),
  mkAdd('T6-6.4.3-BHA', '6.4.3', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '130, 15', '638', 'Table 6'),
  mkAdd('T6-6.4.3-BHT', '6.4.3', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '130, 15', '638', 'Table 6'),
  mkAdd('T6-6.4.3-PHOS', '6.4.3', 'PHOSPHATES', ['phosphates'], null, '2500', 'mg/kg', '33, 211', '639', 'Table 6'),
  mkAdd('T6-6.4.3-SOR', '6.4.3', 'SORBATES', ['sorbates'], null, '2000', 'mg/kg', '42, 211', '639', 'Table 6'),
  mkAdd('T6-6.4.3-TBHQ', '6.4.3', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '130, 15', '640', 'Table 6'),

  // 6.5 Cereals/pulses and starch based desserts
  mkAdd('T6-6.5-ACE', '6.5', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', '188', '640', 'Table 6'),
  mkAdd('T6-6.5-BEN', '6.5', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '640', 'Table 6'),
  mkAdd('T6-6.5-PHOS', '6.5', 'PHOSPHATES', ['phosphates'], null, '7000', 'mg/kg', '33', '641', 'Table 6'),
  mkAdd('T6-6.5-SAC', '6.5', 'SACCHARINS', ['saccharins'], null, '100', 'mg/kg', null, '641', 'Table 6'),
  mkAdd('T6-6.5-SOR', '6.5', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '641', 'Table 6'),
  mkAdd('T6-6.5-STE', '6.5', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '165', 'mg/kg', '26', '641', 'Table 6'),
  mkAdd('T6-6.5-SUC', '6.5', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', null, '641', 'Table 6'),

  // 6.8.1 Soybean based beverages
  mkAdd('T6-6.8.1-PHOS', '6.8.1', 'PHOSPHATES', ['phosphates'], null, '1300', 'mg/kg', '33', '643', 'Table 6'),
  mkAdd('T6-6.8.1-STE', '6.8.1', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '200', 'mg/kg', '26', '643', 'Table 6'),
  mkAdd('T6-6.8.1-SUC', '6.8.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', null, '643', 'Table 6'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 7: BAKERY PRODUCTS (pages 644–654)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE7_RULES: FSSAIAdditiveRule[] = [
  // 7.0 Bakery products (general)
  mkAdd('T7-7.0-BEN', '7.0', 'Benzoic acid', ['benzoic acid', 'sodium benzoate', 'INS 210'], '210', '1000', 'mg/kg', '13', '644', 'Table 7'),
  mkAdd('T7-7.0-BHA', '7.0', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '180, 15', '644', 'Table 7'),
  mkAdd('T7-7.0-BHT', '7.0', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '180, 15', '644', 'Table 7'),
  mkAdd('T7-7.0-SOR', '7.0', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '645', 'Table 7'),

  // 7.1 Bread and ordinary bakery wares and mixes
  mkAdd('T7-7.1-ACE', '7.1', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '188', '645', 'Table 7'),
  mkAdd('T7-7.1-ASP', '7.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '4000', 'mg/kg', '191', '645', 'Table 7'),
  mkAdd('T7-7.1-SUC', '7.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '650', 'mg/kg', null, '645', 'Table 7'),

  // 7.1.1 Bread and rolls
  mkAdd('T7-7.1.1-PHOS', '7.1.1', 'PHOSPHATES', ['phosphates'], null, '9300', 'mg/kg', '229, 33', '646', 'Table 7'),
  mkAdd('T7-7.1.1-POLY', '7.1.1', 'POLYSORBATES', ['polysorbates'], null, '3000', 'mg/kg', null, '646', 'Table 7'),
  mkAdd('T7-7.1.1-TBHQ', '7.1.1', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '195, 15', '646', 'Table 7'),

  // 7.1.2 Crackers
  mkAdd('T7-7.1.2-PHOS', '7.1.2', 'PHOSPHATES', ['phosphates'], null, '9300', 'mg/kg', '229, 33', '646', 'Table 7'),
  mkAdd('T7-7.1.2-POLY', '7.1.2', 'POLYSORBATES', ['polysorbates'], null, '5000', 'mg/kg', '11', '646', 'Table 7'),
  mkAdd('T7-7.1.2-TBHQ', '7.1.2', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', '15, 195', '647', 'Table 7'),

  // 7.2 Fine bakery wares
  mkAdd('T7-7.2-NIS', '7.2', 'Nisin', ['nisin', 'INS 234'], '234', '6.25', 'mg/kg', '233', '649', 'Table 7'),

  // 7.2.1 Cakes, cookies, biscuit, cracker and pies
  mkAdd('T7-7.2.1-ACE', '7.2.1', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '165, 188', '650', 'Table 7'),
  mkAdd('T7-7.2.1-ASP', '7.2.1', 'Aspartame', ['aspartame', 'INS 951'], '951', '1700', 'mg/kg', '191, 165', '650', 'Table 7'),
  mkAdd('T7-7.2.1-BEN', '7.2.1', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '650', 'Table 7'),
  mkAdd('T7-7.2.1-PHOS', '7.2.1', 'PHOSPHATES', ['phosphates'], null, '9300', 'mg/kg', '229, 33', '650', 'Table 7'),
  mkAdd('T7-7.2.1-SAC', '7.2.1', 'SACCHARINS', ['saccharins', 'saccharin'], null, '170', 'mg/kg', '165', '651', 'Table 7'),
  mkAdd('T7-7.2.1-SOR', '7.2.1', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '651', 'Table 7'),
  mkAdd('T7-7.2.1-SUC', '7.2.1', 'Sucralose', ['sucralose', 'INS 955'], '955', '700', 'mg/kg', '165', '651', 'Table 7'),
  mkAdd('T7-7.2.1-SUL', '7.2.1', 'SULFITES', ['sulfites'], null, '50', 'mg/kg', '44', '651', 'Table 7'),
  mkAdd('T7-7.2.1-POLY', '7.2.1', 'POLYSORBATES', ['polysorbates'], null, '3000', 'mg/kg', null, '651', 'Table 7'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 8: MEAT AND MEAT PRODUCTS (pages 655–661)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE8_RULES: FSSAIAdditiveRule[] = [
  // 8.2 Processed meat and poultry — whole pieces
  mkAdd('T8-8.2-BHA', '8.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 130', '655', 'Table 8'),
  mkAdd('T8-8.2-BHT', '8.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '100', 'mg/kg', '15, 130', '656', 'Table 8'),
  mkAdd('T8-8.2-TBHQ', '8.2', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '100', 'mg/kg', '15, 167, 130', '655', 'Table 8'),
  mkAdd('T8-8.2-POLY', '8.2', 'POLYSORBATES', ['polysorbates'], null, '5000', 'mg/kg', 'XS97, XS96', '655', 'Table 8'),

  // 8.2.1 Non-heat treated processed meat
  mkAdd('T8-8.2.1-PHOS', '8.2.1', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '656', 'Table 8'),

  // 8.2.1.2 Cured and dried processed meat
  mkAdd('T8-8.2.1.2-BEN', '8.2.1.2', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '3, 13', '657', 'Table 8'),

  // 8.2.1.3 Fermented non-heated processed meat
  mkAdd('T8-8.2.1.3-NIT', '8.2.1.3', 'NITRITES', ['nitrites', 'sodium nitrite', 'potassium nitrite', 'INS 250'], null, '80', 'mg/kg', '32, 288', '657', 'Table 8'),

  // 8.2.2 Heat-treated processed meat
  mkAdd('T8-8.2.2-NIS', '8.2.2', 'Nisin', ['nisin', 'INS 234'], '234', '25', 'mg/kg', '330, XS97, XS96, 233', '657', 'Table 8'),
  mkAdd('T8-8.2.2-NIT', '8.2.2', 'NITRITES', ['nitrites', 'sodium nitrite'], null, '80', 'mg/kg', '32, 288', '657', 'Table 8'),
  mkAdd('T8-8.2.2-PHOS', '8.2.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '657', 'Table 8'),
  mkAdd('T8-8.2.2-SAC', '8.2.2', 'SACCHARINS', ['saccharins'], null, '500', 'mg/kg', 'XS97, XS96', '657', 'Table 8'),

  // 8.3 Processed comminuted meat
  mkAdd('T8-8.3-BHA', '8.3', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', 'XS89, XS98, 130, 15', '658', 'Table 8'),
  mkAdd('T8-8.3-BHT', '8.3', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '100', 'mg/kg', 'XS89, XS98, 15, 130', '658', 'Table 8'),
  mkAdd('T8-8.3-NIT', '8.3', 'NITRITES', ['nitrites', 'sodium nitrite'], null, '80', 'mg/kg', '286, 32', '658', 'Table 8'),
  mkAdd('T8-8.3-PHOS', '8.3', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33, 302', '658', 'Table 8'),
  mkAdd('T8-8.3-SOR', '8.3', 'SORBATES', ['sorbates'], null, '1500', 'mg/kg', 'XS89, XS98, 42', '658', 'Table 8'),
  mkAdd('T8-8.3-TBHQ', '8.3', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '100', 'mg/kg', 'XS 89, XS 98, 15, 130, 162', '658', 'Table 8'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 9: FISH AND FISH PRODUCTS (pages 662–679)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE9_RULES: FSSAIAdditiveRule[] = [
  // 9.1.2 Fresh molluscs, crustaceans, and echinoderms
  mkAdd('T9-9.1.2-SUL', '9.1.2', 'SULFITES', ['sulfites'], null, '100', 'mg/kg', '44', '662', 'Table 9'),

  // 9.2.1 Frozen fish, fish fillets
  mkAdd('T9-9.2.1-BHA', '9.2.1', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 180', '663', 'Table 9'),
  mkAdd('T9-9.2.1-BHT', '9.2.1', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '15, 180', '663', 'Table 9'),
  mkAdd('T9-9.2.1-PHOS', '9.2.1', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '663', 'Table 9'),
  mkAdd('T9-9.2.1-SUL', '9.2.1', 'SULFITES', ['sulfites'], null, '100', 'mg/kg', '44, 139', '663', 'Table 9'),
  mkAdd('T9-9.2.1-EDTA', '9.2.1', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA', 'INS 385'], null, '75', 'mg/kg', '21', '663', 'Table 9'),

  // 9.2.2 Frozen battered fish
  mkAdd('T9-9.2.2-BHA', '9.2.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 180', '665', 'Table 9'),
  mkAdd('T9-9.2.2-BHT', '9.2.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '15, 180', '665', 'Table 9'),
  mkAdd('T9-9.2.2-PHOS', '9.2.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '666', 'Table 9'),
  mkAdd('T9-9.2.2-EDTA', '9.2.2', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA'], null, '75', 'mg/kg', '21', '666', 'Table 9'),

  // 9.2.4.1 Cooked fish
  mkAdd('T9-9.2.4.1-PHOS', '9.2.4.1', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '671', 'Table 9'),
  mkAdd('T9-9.2.4.1-SOR', '9.2.4.1', 'SORBATES', ['sorbates'], null, '2000', 'mg/kg', '42', '671', 'Table 9'),
  mkAdd('T9-9.2.4.1-EDTA', '9.2.4.1', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA'], null, '50', 'mg/kg', '21', '671', 'Table 9'),

  // 9.2.4.2 Cooked molluscs, crustaceans
  mkAdd('T9-9.2.4.2-BEN', '9.2.4.2', 'BENZOATES', ['benzoates'], null, '2000', 'mg/kg', '13, 82', '671', 'Table 9'),
  mkAdd('T9-9.2.4.2-PHOS', '9.2.4.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', null, '672', 'Table 9'),
  mkAdd('T9-9.2.4.2-SOR', '9.2.4.2', 'SORBATES', ['sorbates'], null, '2000', 'mg/kg', '42, 82', '672', 'Table 9'),
  mkAdd('T9-9.2.4.2-SUL', '9.2.4.2', 'SULFITES', ['sulfites'], null, '150', 'mg/kg', '44', '672', 'Table 9'),

  // 9.2.5 Smoked, dried, fermented, salted fish
  mkAdd('T9-9.2.5-BHA', '9.2.5', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 196', '673', 'Table 9'),
  mkAdd('T9-9.2.5-BHT', '9.2.5', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '15, 196', '673', 'Table 9'),
  mkAdd('T9-9.2.5-BEN', '9.2.5', 'BENZOATES', ['benzoates'], null, '200', 'mg/kg', null, '673', 'Table 9'),
  mkAdd('T9-9.2.5-SOR', '9.2.5', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '674', 'Table 9'),
  mkAdd('T9-9.2.5-SUL', '9.2.5', 'SULFITES', ['sulfites'], null, '30', 'mg/kg', null, '674', 'Table 9'),

  // 9.3 Semi preserved fish
  mkAdd('T9-9.3-ACE', '9.3', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '200', 'mg/kg', '144, 188', '675', 'Table 9'),
  mkAdd('T9-9.3-ASP', '9.3', 'Aspartame', ['aspartame', 'INS 951'], '951', '300', 'mg/kg', '144, 191', '675', 'Table 9'),
  mkAdd('T9-9.3-BEN', '9.3', 'BENZOATES', ['benzoates'], null, '2000', 'mg/kg', '13, 120', '675', 'Table 9'),
  mkAdd('T9-9.3-SOR', '9.3', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '676', 'Table 9'),

  // 9.4 Fully preserved, canned fish
  mkAdd('T9-9.4-ACE', '9.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '200', 'mg/kg', '144, 188', '677', 'Table 9'),
  mkAdd('T9-9.4-ASP', '9.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '300', 'mg/kg', '144, 191', '677', 'Table 9'),
  mkAdd('T9-9.4-BHA', '9.4', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 180', '678', 'Table 9'),
  mkAdd('T9-9.4-BHT', '9.4', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '15, 180', '678', 'Table 9'),
  mkAdd('T9-9.4-PHOS', '9.4', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33', '678', 'Table 9'),
  mkAdd('T9-9.4-SUL', '9.4', 'SULFITES', ['sulfites'], null, '150', 'mg/kg', '44, 140', '678', 'Table 9'),
  mkAdd('T9-9.4-EDTA', '9.4', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA'], null, '340', 'mg/kg', '21', '678', 'Table 9'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 10: EGGS AND EGG PRODUCTS (pages 680–684)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE10_RULES: FSSAIAdditiveRule[] = [
  // 10.2.1 Liquid egg products
  mkAdd('T10-10.2.1-BEN', '10.2.1', 'BENZOATES', ['benzoates'], null, '5000', 'mg/kg', '13', '680', 'Table 10'),
  mkAdd('T10-10.2.1-PHOS', '10.2.1', 'PHOSPHATES', ['phosphates'], null, '4400', 'mg/kg', '67, 33', '680', 'Table 10'),
  mkAdd('T10-10.2.1-SOR', '10.2.1', 'SORBATES', ['sorbates'], null, '5000', 'mg/kg', '42', '680', 'Table 10'),

  // 10.2.2 Frozen egg products
  mkAdd('T10-10.2.2-PHOS', '10.2.2', 'PHOSPHATES', ['phosphates'], null, '1290', 'mg/kg', '67, 33', '681', 'Table 10'),
  mkAdd('T10-10.2.2-SOR', '10.2.2', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '681', 'Table 10'),
  mkAdd('T10-10.2.2-EDTA', '10.2.2', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA'], null, '200', 'mg/kg', '21, 47', '682', 'Table 10'),

  // 10.2.3 Dried and/or heat coagulated egg products
  mkAdd('T10-10.2.3-SOR', '10.2.3', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '683', 'Table 10'),
  mkAdd('T10-10.2.3-EDTA', '10.2.3', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA'], null, '200', 'mg/kg', '21, 47', '683', 'Table 10'),

  // 10.3 Preserved eggs
  mkAdd('T10-10.3-PHOS', '10.3', 'PHOSPHATES', ['phosphates'], null, '1000', 'mg/kg', '33', '683', 'Table 10'),

  // 10.4 Egg based desserts
  mkAdd('T10-10.4-ACE', '10.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', '188', '683', 'Table 10'),
  mkAdd('T10-10.4-ASP', '10.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '1000', 'mg/kg', '191', '683', 'Table 10'),
  mkAdd('T10-10.4-BEN', '10.4', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '683', 'Table 10'),
  mkAdd('T10-10.4-PHOS', '10.4', 'PHOSPHATES', ['phosphates'], null, '1400', 'mg/kg', '33', '683', 'Table 10'),
  mkAdd('T10-10.4-SAC', '10.4', 'SACCHARINS', ['saccharins'], null, '100', 'mg/kg', '144', '683', 'Table 10'),
  mkAdd('T10-10.4-SOR', '10.4', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '683', 'Table 10'),
  mkAdd('T10-10.4-STE', '10.4', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '330', 'mg/kg', '26', '683', 'Table 10'),
  mkAdd('T10-10.4-SUC', '10.4', 'Sucralose', ['sucralose', 'INS 955'], '955', '400', 'mg/kg', null, '683', 'Table 10'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 11: SWEETENERS INCLUDING HONEY (pages 685–691)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE11_RULES: FSSAIAdditiveRule[] = [
  // 11.1.1 White sugar, dextrose, fructose
  mkAdd('T11-11.1.1-SUL', '11.1.1', 'SULFITES', ['sulfites'], null, '15', 'mg/kg', '44', '685', 'Table 11'),

  // 11.1.2 Powdered sugar, icing sugar
  mkAdd('T11-11.1.2-PHOS', '11.1.2', 'PHOSPHATES', ['phosphates'], null, '6600', 'mg/kg', '56, 33', '685', 'Table 11'),
  mkAdd('T11-11.1.2-SUL', '11.1.2', 'SULFITES', ['sulfites'], null, '20', 'mg/kg', '44', '685', 'Table 11'),

  // 11.1.3 Soft white sugar, glucose syrup
  mkAdd('T11-11.1.3-SUL', '11.1.3', 'SULFITES', ['sulfites'], null, '150', 'mg/kg', '44, 111', '685', 'Table 11'),

  // 11.1.5 Plantation or mill white sugar
  mkAdd('T11-11.1.5-SUL', '11.1.5', 'SULFITES', ['sulfites'], null, '70', 'mg/kg', '44', '686', 'Table 11'),

  // 11.1.6 Gur or Jaggery
  mkAdd('T11-11.1.6-SUL', '11.1.6', 'Sulfites', ['sulfites'], null, '50', 'mg/kg', 'Residue not to exceed 50mg/Kg in the end product', '686', 'Table 11'),

  // 11.4 Other sugars and syrups (e.g. maple syrup, sugar toppings)
  mkAdd('T11-11.4-ACE', '11.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', '159, 188', '687', 'Table 11'),
  mkAdd('T11-11.4-ASP', '11.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '3000', 'mg/kg', '159, 191', '687', 'Table 11'),
  mkAdd('T11-11.4-BEN', '11.4', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '687', 'Table 11'),
  mkAdd('T11-11.4-PHOS', '11.4', 'PHOSPHATES', ['phosphates'], null, '1320', 'mg/kg', '56, 33', '689', 'Table 11'),
  mkAdd('T11-11.4-SAC', '11.4', 'SACCHARINS', ['saccharins'], null, '300', 'mg/kg', '159', '689', 'Table 11'),
  mkAdd('T11-11.4-SOR', '11.4', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '689', 'Table 11'),
  mkAdd('T11-11.4-SUC', '11.4', 'Sucralose', ['sucralose', 'INS 955'], '955', '1500', 'mg/kg', '159', '690', 'Table 11'),
  mkAdd('T11-11.4-SUL', '11.4', 'SULFITES', ['sulfites'], null, '40', 'mg/kg', '44', '689', 'Table 11'),

  // 11.6 Table-top sweeteners
  mkAdd('T11-11.6-ACE', '11.6', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', 'GMP', 'GMP', '188', '690', 'Table 11'),
  mkAdd('T11-11.6-ASP', '11.6', 'Aspartame', ['aspartame', 'INS 951'], '951', 'GMP', 'GMP', '191', '690', 'Table 11'),
  mkAdd('T11-11.6-NEO', '11.6', 'Neotame', ['neotame', 'INS 961'], '961', 'GMP', 'GMP', null, '690', 'Table 11'),
  mkAdd('T11-11.6-SAC', '11.6', 'SACCHARINS', ['saccharins'], null, 'GMP', 'GMP', null, '690', 'Table 11'),
  mkAdd('T11-11.6-SOR', '11.6', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42, 192', '691', 'Table 11'),
  mkAdd('T11-11.6-STE', '11.6', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', 'GMP', 'GMP', '26', '690', 'Table 11'),
  mkAdd('T11-11.6-SUC', '11.6', 'Sucralose', ['sucralose', 'INS 955'], '955', 'GMP', 'GMP', null, '690', 'Table 11'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 12: SALTS, SPICES, SOUPS, SAUCES, SALADS AND PROTEIN PRODUCTS (pages 691–703)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE12_RULES: FSSAIAdditiveRule[] = [
  // 12.1.1 Salt
  mkAdd('T12-12.1.1-PHOS', '12.1.1', 'PHOSPHATES', ['phosphates'], null, '8800', 'mg/kg', '33', '691', 'Table 12'),
  mkAdd('T12-12.1.1-EDTA', '12.1.1', 'ETHYLENE DIAMINE TETRA ACETATES (EDTA)', ['EDTA'], null, '50', 'mg/kg', null, '692', 'Table 12'),

  // 12.1.2 Salt substitutes
  mkAdd('T12-12.1.2-PHOS', '12.1.2', 'PHOSPHATES', ['phosphates'], null, '4400', 'mg/kg', null, '692', 'Table 12'),

  // 12.2 Herbs, spices, seasonings and condiments
  mkAdd('T12-12.2-BHA', '12.2', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 130', '693', 'Table 12'),
  mkAdd('T12-12.2-BHT', '12.2', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '200', 'mg/kg', '15, 130', '693', 'Table 12'),
  mkAdd('T12-12.2-SOR', '12.2', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '693', 'Table 12'),
  mkAdd('T12-12.2-TBHQ', '12.2', 'Tertiary butyl hydroquinone', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', null, '693', 'Table 12'),

  // 12.2.1 Herbs, spices, masalas
  mkAdd('T12-12.2.1-SUL', '12.2.1', 'SULFITES', ['sulfites'], null, '150', 'mg/kg', null, '693', 'Table 12'),

  // 12.2.2 Seasonings and condiments
  mkAdd('T12-12.2.2-BEN', '12.2.2', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', '13', '694', 'Table 12'),
  mkAdd('T12-12.2.2-ASP', '12.2.2', 'Aspartame', ['aspartame', 'INS 951'], '951', '2000', 'mg/kg', null, '694', 'Table 12'),
  mkAdd('T12-12.2.2-PHOS', '12.2.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', '33, 69[226]', '694', 'Table 12'),
  mkAdd('T12-12.2.2-SAC', '12.2.2', 'SACCHARINS', ['saccharins'], null, '1500', 'mg/kg', null, '694', 'Table 12'),
  mkAdd('T12-12.2.2-SUC', '12.2.2', 'Sucralose', ['sucralose', 'INS 955'], '955', '700', 'mg/kg', null, '694', 'Table 12'),
  mkAdd('T12-12.2.2-SUL', '12.2.2', 'SULFITES', ['sulfites'], null, '200', 'mg/kg', '44', '694', 'Table 12'),

  // 12.3 Vinegars
  mkAdd('T12-12.3-BEN', '12.3', 'BENZOATES', ['benzoates', 'benzoic acid'], '210', '1000', 'mg/kg', 'Only in brewed vinegar', '694', 'Table 12'),
  mkAdd('T12-12.3-SUL', '12.3', 'SULFITES', ['sulfites'], null, '100', 'mg/kg', null, '694', 'Table 12'),

  // 12.4 Mustards
  mkAdd('T12-12.4-ACE', '12.4', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', null, '695', 'Table 12'),
  mkAdd('T12-12.4-ASP', '12.4', 'Aspartame', ['aspartame', 'INS 951'], '951', '350', 'mg/kg', '191', '695', 'Table 12'),
  mkAdd('T12-12.4-BEN', '12.4', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', null, '695', 'Table 12'),
  mkAdd('T12-12.4-SOR', '12.4', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '695', 'Table 12'),
  mkAdd('T12-12.4-SUL', '12.4', 'SULFITES', ['sulfites'], null, '250', 'mg/kg', null, '695', 'Table 12'),
  mkAdd('T12-12.4-SUC', '12.4', 'Sucralose', ['sucralose', 'INS 955'], '955', '140', 'mg/kg', null, '696', 'Table 12'),
  mkAdd('T12-12.4-TBHQ', '12.4', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', null, '696', 'Table 12'),

  // 12.5 Soups and broths
  mkAdd('T12-12.5-ACE', '12.5', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '110', 'mg/kg', null, '696', 'Table 12'),
  mkAdd('T12-12.5-ASP', '12.5', 'Aspartame', ['aspartame', 'INS 951'], '951', '1200', 'mg/kg', null, '696', 'Table 12'),
  mkAdd('T12-12.5-BEN', '12.5', 'BENZOATES', ['benzoates'], null, '500', 'mg/kg', null, '696', 'Table 12'),
  mkAdd('T12-12.5-BHA', '12.5', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 130', '696', 'Table 12'),
  mkAdd('T12-12.5-BHT', '12.5', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '100', 'mg/kg', '15, 130', '696', 'Table 12'),
  mkAdd('T12-12.5-PHOS', '12.5', 'PHOSPHATES', ['phosphates'], null, '1500', 'mg/kg', null, '697', 'Table 12'),
  mkAdd('T12-12.5-SAC', '12.5', 'SACCHARINS', ['saccharins'], null, '110', 'mg/kg', null, '697', 'Table 12'),
  mkAdd('T12-12.5-SOR', '12.5', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '697', 'Table 12'),
  mkAdd('T12-12.5-SUC', '12.5', 'Sucralose', ['sucralose', 'INS 955'], '955', '600', 'mg/kg', null, '697', 'Table 12'),
  mkAdd('T12-12.5-TBHQ', '12.5', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', null, '697', 'Table 12'),

  // 12.6 Sauces and like products
  mkAdd('T12-12.6-ACE', '12.6', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '1000', 'mg/kg', null, '698', 'Table 12'),
  mkAdd('T12-12.6-ASP', '12.6', 'Aspartame', ['aspartame', 'INS 951'], '951', '350', 'mg/kg', null, '698', 'Table 12'),
  mkAdd('T12-12.6-BEN', '12.6', 'BENZOATES', ['benzoates'], null, '1000', 'mg/kg', null, '699', 'Table 12'),
  mkAdd('T12-12.6-BHA', '12.6', 'Butylated hydroxyanisole (BHA)', ['BHA', 'INS 320'], '320', '200', 'mg/kg', '15, 130', '698', 'Table 12'),
  mkAdd('T12-12.6-BHT', '12.6', 'Butylated hydroxytoluene (BHT)', ['BHT', 'INS 321'], '321', '100', 'mg/kg', '15, 130', '699', 'Table 12'),
  mkAdd('T12-12.6-PHOS', '12.6', 'PHOSPHATES', ['phosphates'], null, '300', 'mg/kg', null, '699', 'Table 12'),
  mkAdd('T12-12.6-SAC', '12.6', 'SACCHARINS', ['saccharins'], null, '160', 'mg/kg', null, '699', 'Table 12'),
  mkAdd('T12-12.6-SOR', '12.6', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '699', 'Table 12'),
  mkAdd('T12-12.6-SUL', '12.6', 'SULFITES', ['sulfites'], null, '300', 'mg/kg', null, '699', 'Table 12'),
  mkAdd('T12-12.6-SUC', '12.6', 'Sucralose', ['sucralose', 'INS 955'], '955', '450', 'mg/kg', null, '699', 'Table 12'),
  mkAdd('T12-12.6-TBHQ', '12.6', 'Tertiary butylhydroquinone (TBHQ)', ['TBHQ', 'INS 319'], '319', '200', 'mg/kg', null, '699', 'Table 12'),

  // 12.6.1 Emulsified sauces (mayonnaise, salad dressings)
  mkAdd('T12-12.6.1-PHOS', '12.6.1', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', null, '700', 'Table 12'),
  mkAdd('T12-12.6.1-SOR', '12.6.1', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '700', 'Table 12'),
  mkAdd('T12-12.6.1-STE', '12.6.1', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '350', 'mg/kg', null, '700', 'Table 12'),

  // 12.6.2 Non emulsified sauces (ketchup)
  mkAdd('T12-12.6.2-PHOS', '12.6.2', 'PHOSPHATES', ['phosphates'], null, '2200', 'mg/kg', null, '700', 'Table 12'),
  mkAdd('T12-12.6.2-SOR', '12.6.2', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42, 127', '701', 'Table 12'),
  mkAdd('T12-12.6.2-STE', '12.6.2', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '350', 'mg/kg', null, '700', 'Table 12'),

  // 12.7 Salads and sandwich spreads
  mkAdd('T12-12.7-ACE', '12.7', 'Acesulfame potassium', ['acesulfame potassium', 'INS 950'], '950', '350', 'mg/kg', null, '701', 'Table 12'),
  mkAdd('T12-12.7-ASP', '12.7', 'Aspartame', ['aspartame', 'INS 951'], '951', '350', 'mg/kg', null, '701', 'Table 12'),
  mkAdd('T12-12.7-BEN', '12.7', 'BENZOATES', ['benzoates'], null, '1500', 'mg/kg', null, '701', 'Table 12'),
  mkAdd('T12-12.7-SAC', '12.7', 'SACCHARINS', ['saccharins'], null, '200', 'mg/kg', null, '702', 'Table 12'),
  mkAdd('T12-12.7-SOR', '12.7', 'SORBATES', ['sorbates'], null, '1500', 'mg/kg', null, '702', 'Table 12'),
  mkAdd('T12-12.7-STE', '12.7', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '115', 'mg/kg', null, '702', 'Table 12'),
  mkAdd('T12-12.7-SUC', '12.7', 'Sucralose', ['sucralose', 'INS 955'], '955', '1250', 'mg/kg', null, '702', 'Table 12'),

  // 12.9.1 Fermented soybean paste
  mkAdd('T12-12.9.1-SAC', '12.9.1', 'SACCHARINS', ['saccharins'], null, '200', 'mg/kg', null, '702', 'Table 12'),
  mkAdd('T12-12.9.1-SOR', '12.9.1', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', null, '702', 'Table 12'),

  // 12.9.2.1 Fermented soybean sauce
  mkAdd('T12-12.9.2.1-SAC', '12.9.2.1', 'SACCHARINS', ['saccharins'], null, '500', 'mg/kg', null, '702', 'Table 12'),
  mkAdd('T12-12.9.2.1-SOR', '12.9.2.1', 'SORBATES', ['sorbates'], null, '1000', 'mg/kg', '42', '702', 'Table 12'),
  mkAdd('T12-12.9.2.1-STE', '12.9.2.1', 'Steviol glycosides', ['steviol glycosides', 'stevia', 'INS 960'], '960', '30', 'mg/kg', '26', '702', 'Table 12'),
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 13: FOODS FOR PARTICULAR NUTRITIONAL USES — MANUAL REVIEW STUB
// Source: README §5 and page 704.
// The regulatory data for these categories is contained in separate
// product-specific standards, NOT in Appendix A.
// DO NOT invent or assume any limits for these categories.
// ─────────────────────────────────────────────────────────────────────────────

const TABLE13_STUB_NOTE =
  'Food additive provisions for category 13.0 are provided in the relevant ' +
  'product-specific standards (FSS Food Products Standards and Food Additives ' +
  'Regulations, 2011) or the Food or Health Supplements, Nutraceuticals, ' +
  'Foods for Special Dietary Uses, Foods for Special Medical Purpose, ' +
  'Functional Foods, and Novel Food Regulations, 2016. ' +
  'This dataset does not include those provisions. Manual regulatory review required.';

export const TABLE13_MANUAL_REVIEW_STUB = {
  source_table: 'Table 13',
  food_category_code: '13.0',
  food_category_name: 'Food stuffs intended for particular nutritional uses',
  status: 'MANUAL_REVIEW' as const,
  reason: TABLE13_STUB_NOTE,
  regulation_version: FSSAI_ADDITIVE_RULES_VERSION,
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 14: BEVERAGES — PARTIAL (pages 704+)
// Only 14.1.1 (waters — no additives) and 14.1.2.1 (fruit juices) included.
// Remaining beverage sub-categories require manual review.
// ─────────────────────────────────────────────────────────────────────────────

const TABLE14_RULES: FSSAIAdditiveRule[] = [
  // 14.1.2.1 Fruit juices
  mkAdd('T14-14.1.2.1-ASC', '14.1.2.1', 'Ascorbic acid, L-', ['ascorbic acid', 'vitamin C', 'INS 300'], '300', 'GMP', 'GMP', null, '704', 'Table 14'),
  mkAdd('T14-14.1.2.1-BEN', '14.1.2.1', 'BENZOATES', ['benzoates', 'sodium benzoate'], null, '1000', 'mg/kg', '91, 13', '704', 'Table 14'),
  mkAdd('T14-14.1.2.1-CIT', '14.1.2.1', 'Citric acid', ['citric acid', 'INS 330'], '330', 'GMP', 'GMP', null, '704', 'Table 14'),
];

export const TABLE14_PARTIAL_NOTE =
  'Table 14 (Beverages) is only partially included in this reference dataset. ' +
  'Only categories 14.1.1 (waters) and 14.1.2.1 (fruit juices) are covered. ' +
  'All other beverage sub-categories require manual regulatory review.';

// ─────────────────────────────────────────────────────────────────────────────
// TABLE 15: READY-TO-EAT SAVOURIES — MANUAL REVIEW STUB
// Not included in the reference dataset.
// ─────────────────────────────────────────────────────────────────────────────

export const TABLE15_MANUAL_REVIEW_STUB = {
  source_table: 'Table 15',
  food_category_code: '15.0',
  food_category_name: 'Ready-to-eat savouries',
  status: 'MANUAL_REVIEW' as const,
  reason:
    'Table 15 (Ready-to-eat savouries) is not included in the current reference dataset. ' +
    'Manual regulatory review required. Do not assume any additive is permitted or prohibited.',
  regulation_version: FSSAI_ADDITIVE_RULES_VERSION,
};

// ─────────────────────────────────────────────────────────────────────────────
// PROHIBITED SUBSTANCES
// Source: README §6 — Prohibited Flavouring Agents
// These are in ADDITION to, and separate from, the "No additives permitted"
// category rules above.
// ─────────────────────────────────────────────────────────────────────────────

export const FSSAI_PROHIBITED_SUBSTANCES: FSSAIProhibitedSubstance[] = [
  {
    id: 'PROH-001',
    substance_name: 'Coumarin',
    aliases: ['coumarin', '1,2-benzopyrone', 'benzo-alpha-pyrone'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-002',
    substance_name: 'Dihydrocoumarin',
    aliases: ['dihydrocoumarin', '3,4-dihydrocoumarin', 'hydrocoumarin'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-003',
    substance_name: 'Tonkabean (Dipteryl adorat)',
    aliases: ['tonkabean', 'dipteryl adorat', 'tonka bean', 'coumarin source'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-004',
    substance_name: 'β-asarone',
    aliases: ['beta-asarone', 'β-asarone', 'asarone', 'trans-beta-asarone', '(E)-asarone'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-005',
    substance_name: 'Cinnamyl anthranilate',
    aliases: ['cinnamyl anthranilate', 'cinnamyl 2-aminobenzoate'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-006',
    substance_name: 'Estragole',
    aliases: ['estragole', 'methyl chavicol', '4-allylanisole', 'tarragon'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-007',
    substance_name: 'Ethyl methyl ketone',
    aliases: ['ethyl methyl ketone', 'methyl ethyl ketone', 'MEK', '2-butanone', 'butanone'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-008',
    substance_name: 'Ethyl-3-phenylglycidate',
    aliases: ['ethyl-3-phenylglycidate', 'ethyl phenylglycidate', 'strawberry aldehyde'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-009',
    substance_name: 'Eugenyl methyl ether',
    aliases: ['eugenyl methyl ether', 'methyl eugenol', '4-allyl-1,2-dimethoxybenzene'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-010',
    substance_name: 'Methyl β-naphthyl ketone',
    aliases: ['methyl beta-naphthyl ketone', 'methyl 2-naphthyl ketone', 'oranger crystals', 'acetyl betanaphthol'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-011',
    substance_name: 'p-Propylanisole',
    aliases: ['p-propylanisole', 'para-propylanisole', '4-propylanisole', 'anise propyl ether'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-012',
    substance_name: 'Safrole',
    aliases: ['safrole', '4-allyl-1,2-methylenedioxybenzene', 'shikimol'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-013',
    substance_name: 'Isosafrole',
    aliases: ['isosafrole', '1,2-methylenedioxy-4-propenylbenzene'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-014',
    substance_name: 'Thujone (α and β thujone)',
    aliases: ['thujone', 'alpha-thujone', 'beta-thujone', 'α-thujone', 'β-thujone', 'isothujone'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-015',
    substance_name: '4,5-epoxydec-2(trans)-enal',
    aliases: ['4,5-epoxydec-2(trans)-enal', '4,5-epoxydec-2-enal', 'epoxy decenal'],
    type: 'FLAVOURING_AGENT',
    restriction: 'Prohibited as a flavouring agent in articles of food.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  // Prohibited solvents
  {
    id: 'PROH-016',
    substance_name: 'Diethylene glycol',
    aliases: ['diethylene glycol', 'DEG', '2,2-oxydiethanol', 'oxybisethanol'],
    type: 'SOLVENT',
    restriction: 'Shall not be used as a solvent in flavours.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
  {
    id: 'PROH-017',
    substance_name: 'Monoethyl ether of diethylene glycol',
    aliases: ['monoethyl ether', 'diethylene glycol monoethyl ether', 'DGME', '2-(2-ethoxyethoxy)ethanol'],
    type: 'SOLVENT',
    restriction: 'Shall not be used as a solvent in flavours.',
    source_page: 'Flavouring Agents section',
    version: FSSAI_ADDITIVE_RULES_VERSION,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT — ALL FSSAI ADDITIVE RULES
// ─────────────────────────────────────────────────────────────────────────────

export const FSSAI_ADDITIVE_RULES: FSSAIAdditiveRule[] = [
  ...NO_ADDITIVES_RULES,
  ...TABLE1_RULES,
  ...TABLE2_RULES,
  ...TABLE3_RULES,
  ...TABLE4_RULES,
  ...TABLE5_RULES,
  ...TABLE6_RULES,
  ...TABLE7_RULES,
  ...TABLE8_RULES,
  ...TABLE9_RULES,
  ...TABLE10_RULES,
  ...TABLE11_RULES,
  ...TABLE12_RULES,
  ...TABLE14_RULES,
];

// Metadata
export const FSSAI_ADDITIVE_RULES_METADATA = {
  version: FSSAI_ADDITIVE_RULES_VERSION,
  source: FSSAI_ADDITIVE_RULES_SOURCE,
  effective_date: FSSAI_ADDITIVE_RULES_EFFECTIVE_DATE,
  total_rules: FSSAI_ADDITIVE_RULES.length,
  total_prohibited_substances: FSSAI_PROHIBITED_SUBSTANCES.length,
  tables_covered: ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Table 11', 'Table 12', 'Table 14 (partial)'],
  tables_manual_review: ['Table 13', 'Table 15', 'Table 14 (partial)'],
  note: 'Rules are sourced verbatim from FSSAI_INGREDIENT_RULES_README.md. No limits are invented. GMP is never converted to a numeric value. If no rule is found, return MANUAL_REVIEW.',
};
