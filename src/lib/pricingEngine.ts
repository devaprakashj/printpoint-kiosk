import { ColorMode, DuplexMode, PricingRule } from './types';

export interface PriceCalculationRequest {
  pricingRule: PricingRule;
  totalPages: number;
  pageRangeStr: string; // e.g. "all", "1-5", "1, 3, 5-8"
  copies: number;
  colorMode: ColorMode;
  duplexMode: DuplexMode;
}

export interface PriceCalculationResult {
  pagesToPrintPerCopy: number;
  totalPrintPages: number;
  totalSheets: number;
  ratePerSheetPaise: number;
  subtotalPaise: number;
  taxPaise: number; // e.g. 18% GST or 0%
  totalAmountPaise: number;
  formattedTotalRupees: string;
  formattedSubtotalRupees: string;
}

/**
 * Parses user input page ranges like "1-3, 5, 8-10" and counts valid pages
 */
export function calculatePagesFromRange(rangeStr: string, totalDocPages: number): number {
  const trimmed = rangeStr.trim().toLowerCase();
  if (!trimmed || trimmed === 'all') {
    return totalDocPages;
  }

  const pageSet = new Set<number>();
  const parts = trimmed.split(',');

  for (const part of parts) {
    const cleanPart = part.trim();
    if (cleanPart.includes('-')) {
      const [startStr, endStr] = cleanPart.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(startStr) && !isNaN(endStr)) {
        const min = Math.max(1, Math.min(startStr, endStr));
        const max = Math.min(totalDocPages, Math.max(startStr, endStr));
        for (let i = min; i <= max; i++) {
          pageSet.add(i);
        }
      }
    } else {
      const pageNum = parseInt(cleanPart, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalDocPages) {
        pageSet.add(pageNum);
      }
    }
  }

  return pageSet.size > 0 ? pageSet.size : totalDocPages;
}

/**
 * Calculates exact dynamic price and sheets needed
 */
export function calculateOrderPrice(req: PriceCalculationRequest): PriceCalculationResult {
  const { pricingRule, totalPages, pageRangeStr, copies, colorMode, duplexMode } = req;
  
  const pagesPerCopy = calculatePagesFromRange(pageRangeStr, totalPages);
  const totalPrintPages = pagesPerCopy * Math.max(1, copies);

  // Calculate physical sheets needed
  let sheetsPerCopy: number;
  if (duplexMode === 'duplex') {
    sheetsPerCopy = Math.ceil(pagesPerCopy / 2);
  } else {
    sheetsPerCopy = pagesPerCopy;
  }
  const totalSheets = sheetsPerCopy * Math.max(1, copies);

  // Rate calculation per sheet / page
  let ratePerSheetPaise = 0;
  if (colorMode === 'bw') {
    ratePerSheetPaise = duplexMode === 'duplex' 
      ? pricingRule.bwDuplexPaise 
      : pricingRule.bwSinglePaise;
  } else {
    ratePerSheetPaise = duplexMode === 'duplex' 
      ? pricingRule.colorDuplexPaise 
      : pricingRule.colorSinglePaise;
  }

  const subtotalPaise = Math.max(pricingRule.minimumOrderPaise, totalSheets * ratePerSheetPaise);
  const taxPaise = 0; // In India, student print kiosks often include tax in round-figure pricing
  const totalAmountPaise = subtotalPaise + taxPaise;

  return {
    pagesToPrintPerCopy: pagesPerCopy,
    totalPrintPages,
    totalSheets,
    ratePerSheetPaise,
    subtotalPaise,
    taxPaise,
    totalAmountPaise,
    formattedTotalRupees: `₹${(totalAmountPaise / 100).toFixed(2)}`,
    formattedSubtotalRupees: `₹${(subtotalPaise / 100).toFixed(2)}`,
  };
}
