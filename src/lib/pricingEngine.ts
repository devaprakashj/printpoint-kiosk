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
  const actualCopies = Math.max(1, copies);
  const totalPrintPages = pagesPerCopy * actualCopies;

  const singlePaise = colorMode === 'bw' ? pricingRule.bwSinglePaise : pricingRule.colorSinglePaise;
  const duplexPaise = colorMode === 'bw' ? pricingRule.bwDuplexPaise : pricingRule.colorDuplexPaise;

  let totalSheets = 0;
  let totalRawPaise = 0;

  if (duplexMode === 'simplex' || (pagesPerCopy === 1 && actualCopies === 1)) {
    // 1-sided printing
    totalSheets = totalPrintPages;
    totalRawPaise = totalPrintPages * singlePaise;
  } else if (pagesPerCopy === 1 && actualCopies > 1) {
    // 1-page document with multiple copies printed double-sided (back-to-back)
    const fullDuplexSheets = Math.floor(actualCopies / 2);
    const leftoverSimplex = actualCopies % 2;
    totalSheets = Math.ceil(actualCopies / 2);
    totalRawPaise = (fullDuplexSheets * duplexPaise) + (leftoverSimplex * singlePaise);
  } else {
    // Multi-page document printed double-sided
    const fullDuplexSheetsPerCopy = Math.floor(pagesPerCopy / 2);
    const leftoverSimplexPerCopy = pagesPerCopy % 2;
    const sheetsPerCopy = Math.ceil(pagesPerCopy / 2);
    const costPerCopyPaise = (fullDuplexSheetsPerCopy * duplexPaise) + (leftoverSimplexPerCopy * singlePaise);

    totalSheets = sheetsPerCopy * actualCopies;
    totalRawPaise = costPerCopyPaise * actualCopies;
  }

  const subtotalPaise = Math.max(pricingRule.minimumOrderPaise, totalRawPaise);
  const taxPaise = 0; // In India, student print kiosks often include tax in round-figure pricing
  const totalAmountPaise = subtotalPaise + taxPaise;
  const ratePerSheetPaise = singlePaise;

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
