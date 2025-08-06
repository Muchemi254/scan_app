// src/services/gemini.ts
import type { ResponseSchema, ReceiptData, GeminiResponse, ReceiptItem } from '../types/gemini';

/**
 * Helper to validate and clean Gemini's JSON response
 * @param text Raw response text from Gemini
 * @returns Parsed JSON object
 * @throws Error if parsing fails
 */

const sanitizePrice = (val: any): string => {
  if (typeof val === 'number') return val.toFixed(2);
  if (typeof val !== 'string') return '';

  let cleaned = val.replace(/[^\d.,]/g, '');

  // Remove thousand separators if both . and , exist
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  }

  cleaned = cleaned.replace(/:/g, '.'); // Fix colon errors

  const num = parseFloat(cleaned);
  return isNaN(num) ? '' : num.toFixed(2);
};

const parseGeminiResponse = (text: string): ReceiptData => {
  try {
    // Remove markdown code block notation if present
    const cleanText = text.replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    // Validate basic structure
    if (!parsed.supplier || !parsed.totalAmount) {
      throw new Error("Missing required fields in response");
    }
    
    return {
      supplier: parsed.supplier,
      totalAmount: sanitizePrice(parsed.totalAmount),
      taxAmount: sanitizePrice(parsed.taxAmount),
      receiptDate: parsed.receiptDate || 'N/A',
      cuInvoice: parsed.cuInvoice || 'N/A',
      kraPin: parsed.kraPin || 'N/A',
      invoiceNumber: parsed.invoiceNumber || 'N/A',
      category: parsed.category || 'Other', // Include category in response
      items: Array.isArray(parsed.items) 
        ? parsed.items.map((item: any) => ({
        name: item.name || 'N/A',
        quantity: Number(item.quantity) || 1,
        price: sanitizePrice(item.price)
      }))
      : []
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error(`Invalid response from Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Extracts structured receipt data AND suggests category from an image using Gemini AI
 * @param base64Image Image data in base64 format
 * @param mimeType MIME type of the image (e.g., 'image/jpeg')
 * @returns Promise resolving to parsed receipt data with category
 * @throws Error if extraction fails
 */
export const extractReceiptData = async (
  base64Image: string, 
  mimeType: string
): Promise<ReceiptData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key");

  const responseSchema: ResponseSchema = {
    type: "OBJECT",
    properties: {
      supplier: { 
        type: "STRING",
        description: "Name of the supplier/store" 
      },
      totalAmount: { 
        type: "STRING",
        description: "Total amount including currency symbol if present" 
      },
      taxAmount: { 
        type: "STRING",
        description: "Tax amount if available" 
      },
      receiptDate: { 
        type: "STRING",
        description: "Date in MM/DD/YYYY or DD/MM/YYYY format" 
      },
      cuInvoice: { 
        type: "STRING",
        description: "CU invoice number if available" 
      },
      kraPin: { 
        type: "STRING",
        description: "KRA PIN if available" 
      },
      invoiceNumber: { 
        type: "STRING",
        description: "Generic invoice number if available" 
      },
      category: {
        type: "STRING",
        description: "Category based on supplier and items - must be EXACTLY one of the predefined categories"
      },
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { 
              type: "STRING",
              description: "Name of the item" 
            },
            quantity: { 
              type: "NUMBER",
              description: "Quantity purchased" 
            },
            price: { 
              type: "STRING",
              description: "Price per unit including currency if present" 
            }
          }
        }
      }
    },
    propertyOrdering: [
      "supplier",
      "totalAmount",
      "taxAmount",
      "receiptDate",
      "category",
      "items"
    ]
  };

  const categoryInstructions = `
For the category field, analyze the supplier name and items, then choose EXACTLY ONE category from this list:


"Building Materials", "Hardware & Tools", "Paint & Finishes", "Plumbing & Sanitary", "Electrical Supplies"


"Fuel & Lubricants", "Vehicle Maintenance", "Transport Services", "Energy & Utilities"


"Seeds & Inputs", "Fertilizers & Chemicals", "Irrigation Supplies", "Farm Tools & Equipment",
"Animal Feed & Supplements", "Veterinary Services", "Livestock & Poultry",
"Crop Harvesting & Processing", "Greenhouse Supplies", "Agro Consultancy & Training"


"Furniture & Fixtures", "Electronics & Appliances", "Utensils & Cutlery",
"Cleaning Supplies", "Stationery & Office Supplies"

"Groceries & Provisions", "Perishables", "Beverages", "Restaurant & Catering"


"Clothing & Footwear", "Personal Care & Beauty", "Health & Medicine", "Baby & Kids Supplies"


"Phones & Accessories", "Computers & IT Equipment", "Internet & Airtime"


"Gifts & Donations", "Entertainment & Leisure", "Education & Learning", "Subscriptions & Memberships"

"Raw Materials", "Packaging Supplies", "Marketing & Branding", "Employee Salaries & Wages",
"Professional Services", "Licenses & Permits"


"Rent & Lease", "Land & Property Purchases", "Security & Surveillance"


"Repairs & Maintenance", "Emergency Purchases"

Return the EXACT category name from the list above.`;

  const payload = {
    contents: [{
      role: "user",
      parts: [
        { 
          text: `Extract receipt details from this image and categorize it. Return only JSON matching the provided schema.

INSTRUCTIONS:
- For amounts, include currency symbols if present
- For missing fields, use 'N/A'
- Ensure dates are in MM/DD/YYYY format if possible
- ${categoryInstructions}`
        },
        { 
          inlineData: {
            mimeType,
            data: base64Image
          }
        }
      ]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1 // Lower temperature for more consistent results
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData: GeminiResponse = await response.json();
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const result: GeminiResponse = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("No text content in Gemini response");
    }

    return parseGeminiResponse(responseText);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Receipt extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Suggests a category for a receipt based on supplier and items
 * @param supplier Name of the supplier
 * @param items Array of receipt items
 * @returns Promise resolving to suggested category string
 * @deprecated Use extractReceiptData instead - now includes categorization
 */
/*
export const suggestCategory = async (
  supplier: string,
  items: ReceiptItem[]
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key");

  const itemText = items
    .map(item => item.name)
    .filter(Boolean)
    .join(", ") || "N/A";

  const prompt = `Categorize this receipt in exactly one word based on the supplier and items.
Only choose one of the following categories (do not return anything else):

"Building Materials", "Hardware & Tools", "Paint & Finishes", "Plumbing & Sanitary", "Electrical Supplies",
"Fuel & Lubricants", "Vehicle Maintenance", "Transport Services", "Energy & Utilities",
"Seeds & Inputs", "Fertilizers & Chemicals", "Irrigation Supplies", "Farm Tools & Equipment",
"Animal Feed & Supplements", "Veterinary Services", "Livestock & Poultry",
"Crop Harvesting & Processing", "Greenhouse Supplies", "Agro Consultancy & Training",
"Furniture & Fixtures", "Electronics & Appliances", "Utensils & Cutlery",
"Cleaning Supplies", "Stationery & Office Supplies",
"Groceries & Provisions", "Perishables", "Beverages", "Restaurant & Catering",
"Clothing & Footwear", "Personal Care & Beauty", "Health & Medicine", "Baby & Kids Supplies",
"Phones & Accessories", "Computers & IT Equipment", "Internet & Airtime",
"Gifts & Donations", "Entertainment & Leisure", "Education & Learning", "Subscriptions & Memberships",
"Raw Materials", "Packaging Supplies", "Marketing & Branding", "Employee Salaries & Wages",
"Professional Services", "Licenses & Permits",
"Rent & Lease", "Land & Property Purchases", "Security & Surveillance",
"Repairs & Maintenance", "Emergency Purchases"

Supplier: ${supplier}
Items: ${itemText}

Return ONLY the exact category name (copy-paste from list above).`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 10
          }
        })
      }
    );

    const result: GeminiResponse = await response.json();
    const category = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log("🧠 Gemini raw category response:", category);

    const validCategories: string[] = [ 
      "Building Materials", "Hardware & Tools", "Paint & Finishes", "Plumbing & Sanitary", "Electrical Supplies",
      "Fuel & Lubricants", "Vehicle Maintenance", "Transport Services", "Energy & Utilities",
      "Seeds & Inputs", "Fertilizers & Chemicals", "Irrigation Supplies", "Farm Tools & Equipment",
      "Animal Feed & Supplements", "Veterinary Services", "Livestock & Poultry",
      "Crop Harvesting & Processing", "Greenhouse Supplies", "Agro Consultancy & Training",
      "Furniture & Fixtures", "Electronics & Appliances", "Utensils & Cutlery",
      "Cleaning Supplies", "Stationery & Office Supplies",
      "Groceries & Provisions", "Perishables", "Beverages", "Restaurant & Catering",
      "Clothing & Footwear", "Personal Care & Beauty", "Health & Medicine", "Baby & Kids Supplies",
      "Phones & Accessories", "Computers & IT Equipment", "Internet & Airtime",
      "Gifts & Donations", "Entertainment & Leisure", "Education & Learning", "Subscriptions & Memberships",
      "Raw Materials", "Packaging Supplies", "Marketing & Branding", "Employee Salaries & Wages",
      "Professional Services", "Licenses & Permits",
      "Rent & Lease", "Land & Property Purchases", "Security & Surveillance",
      "Repairs & Maintenance", "Emergency Purchases"
    ];

    if (category && validCategories.includes(category)) {
      return category;
    }

    return "Other";
  } catch (error) {
    console.error("Category suggestion failed:", error);
    return "Other";
  }
}; */
/**
 * Generates a human-readable spending summary from receipt data
 * @param receipts Array of receipt data
 * @returns Promise resolving to formatted summary text
 */
export const generateSummary = async (receipts: ReceiptData[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key");

  if (!receipts.length) {
    return "No receipt data available to generate summary";
  }

  // Prepare structured data for the AI
  const receiptTexts = receipts.map(r => {
    const date = r.receiptDate || 'Unknown date';
    const total = r.totalAmount || 'Unknown amount';
    const category = r.category || 'Uncategorized';
    const items = r.items?.map(i => 
      `${i.name} (${i.quantity} × ${i.price})`
    ).join(', ') || 'No items listed';

    return `[${date}] ${r.supplier} - ${total} (${category})
    Items: ${items}`;
  }).join('\n\n');

  const prompt = `Analyze these receipts and generate a concise spending summary with these sections:
  1. Total Spending (sum of all receipts)
  2. Spending by Category (if available)
  3. Top 3 Most Frequent Suppliers
  4. Notable Observations or Patterns

  Format the response with clear section headings and bullet points where appropriate.

  Receipt Data:
  ${receiptTexts}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3, // Slight creativity for better summaries
            maxOutputTokens: 500
          }
        })
      }
    );

    const result: GeminiResponse = await response.json();
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    return summary || "Could not generate summary from the receipt data";
  } catch (error) {
    console.error("Summary generation failed:", error);
    return "Error generating spending summary";
  }
};