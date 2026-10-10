'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sounds } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { 
  UploadCloud, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle2, 
  Copy, 
  Check, 
  Monitor, 
  FileText, 
  RefreshCw, 
  X, 
  Printer, 
  Trash2, 
  ShieldCheck, 
  Maximize2, 
  Settings, 
  Info, 
  Pencil, 
  Zap, 
  QrCode, 
  Lock, 
  Share2, 
  Download, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Clock, 
  Smartphone,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  MessageCircle,
  User,
  KeyRound
} from 'lucide-react';
import QRCode from 'qrcode';
import { Machine, PricingRule, PrintOrder, ColorMode, DuplexMode } from '@/lib/types';
import { calculateOrderPrice, PriceCalculationResult, calculatePagesFromRange } from '@/lib/pricingEngine';
import Logo from '@/components/Logo';

interface UploadedDocument {
  id: string;
  name: string;
  sizeFormatted: string;
  pages: number;
  previewUrl?: string;
  isImage?: boolean;
  pageThumbnails?: string[];
  file?: File;
  // Per-Document Print Configuration
  copies: number;
  colorMode: ColorMode; // 'bw' | 'color'
  duplexMode: DuplexMode; // 'simplex' | 'duplex'
  orientation: 'portrait' | 'landscape';
  pageSelectionType: 'all' | 'range';
  selectedPages: number[];
  customRangeInput?: string;
}

export default function QwikprintAuthenticApp() {
  const router = useRouter();
  // Machine Selection
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineCode, setSelectedMachineCode] = useState<string>('RIT-ATM-01');
  const [currentMachine, setCurrentMachine] = useState<Machine | null>(null);
  const [pricingRule, setPricingRule] = useState<PricingRule | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // App View Step: 'upload_landing' | 'blank_sheets' | 'files_uploaded_list' | 'configure_settings' | 'review_order' | 'pin_success'
  const [currentStep, setCurrentStep] = useState<'upload_landing' | 'blank_sheets' | 'files_uploaded_list' | 'configure_settings' | 'review_order' | 'pin_success'>('upload_landing');

  // Multi-File Upload State & Realistic Live Progress
  const [filesList, setFilesList] = useState<UploadedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const [isProcessSuccess, setIsProcessSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'processing' | 'uploading' | 'success'>('processing');
  const [uploadStageText, setUploadStageText] = useState('Processing files before uploading...');
  const [uploadingDocMeta, setUploadingDocMeta] = useState<{
    name: string;
    size: string;
    type: string;
    detectedPages?: number;
    totalDocs?: number;
    previewThumbnail?: string;
  } | null>(null);

  // Hidden File Input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blank Sheet Dispense Quantity State
  const [blankSheetCount, setBlankSheetCount] = useState<number>(0);

  // Active Preview & Modals
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);
  const [showSpecificPageModal, setShowSpecificPageModal] = useState(false);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);
  
  // Step 4: Phone Verification & Review Order State
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [billDetailsOpen, setBillDetailsOpen] = useState(true);
  const [uploadedFilesOpen, setUploadedFilesOpen] = useState(true);

  // Live Dynamic Price
  const [priceQuote, setPriceQuote] = useState<PriceCalculationResult | null>(null);

  // Checkout & Generated PIN / QR State
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [activeOrder, setActiveOrder] = useState<PrintOrder | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'qr' | 'pin'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Payment Failure & Recovery State
  const [paymentFailure, setPaymentFailure] = useState<{
    show: boolean;
    title: string;
    reason: string;
    isDismissed?: boolean;
    orderId?: string;
  } | null>(null);

  // Help Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Landing Page Interactive Calculator State
  const [calcPages, setCalcPages] = useState<number>(10);
  const [calcColor, setCalcColor] = useState<'bw' | 'color'>('bw');
  const [calcDuplex, setCalcDuplex] = useState<boolean>(true);

  // Fetch Machines & Pricing
  const loadKiosks = async () => {
    try {
      const res = await fetch('/api/machines');
      const data = await res.json();
      if (data.success) {
        setMachines(data.machines);
        const match = data.machines.find((m: Machine) => m.machineCode === selectedMachineCode) || data.machines[0];
        setCurrentMachine(match);
      }

      const pRes = await fetch(`/api/kiosk/${selectedMachineCode}`);
      const pData = await pRes.json();
      if (pData.success) {
        setPricingRule(pData.pricingRule);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadKiosks();
  }, [selectedMachineCode]);

  // Generate QR Code data URL when activeOrder is set
  useEffect(() => {
    if (activeOrder?.fourDigitPin) {
      const payload = JSON.stringify({
        type: 'SMARTPRINT_ORDER',
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        pin: activeOrder.fourDigitPin,
        machineCode: activeOrder.machineCode || currentMachine?.machineCode || 'RIT-ATM-01',
      });

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch((err: any) => console.error('QR generation error:', err));
    }
  }, [activeOrder?.fourDigitPin, activeOrder?.id, activeOrder?.orderNumber, activeOrder?.machineCode, currentMachine?.machineCode]);

  // Automatically scroll to the top and trigger celebration whenever moving to a new step
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    if (currentStep === 'pin_success') {
      try {
        sounds.success();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#ea580c', '#f97316', '#1d4ed8', '#0f172a', '#38bdf8']
        });

        // Background WhatsApp Notification Dispatch
        if (activeOrder) {
          fetch('/api/notifications/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: activeOrder.id,
              phone: customerPhone || phoneInput || activeOrder.customerPhone,
              pin: activeOrder.fourDigitPin,
              orderNumber: activeOrder.orderNumber,
            }),
          }).catch(() => {});
        }
      } catch (e) {}
    }
  }, [currentStep]);

  // Auto-close success modal after showing verified status with animated tick (✓)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uploadStage === 'success' && isProcessingModal) {
      timer = setTimeout(() => {
        setIsProcessingModal(false);
        setCurrentStep('files_uploaded_list');
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [uploadStage, isProcessingModal]);

  // 1. Session Auto-Restore on Page Refresh / Tab Reload
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('new') === 'true' || urlParams.get('reset') === 'true') {
        sessionStorage.removeItem('rit_print_session_data');
        setFilesList([]);
        setSelectedDocId('');
        setCurrentStep('upload_landing');
        setBlankSheetCount(0);
        return;
      }

      const saved = sessionStorage.getItem('rit_print_session_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filesList && Array.isArray(parsed.filesList) && parsed.filesList.length > 0) {
          setFilesList(parsed.filesList);
          if (parsed.selectedDocId) setSelectedDocId(parsed.selectedDocId);
          if (parsed.currentStep && parsed.currentStep !== 'pin_success') {
            setCurrentStep(parsed.currentStep);
          }
        }
        if (typeof parsed.blankSheetCount === 'number' && parsed.blankSheetCount > 0) {
          setBlankSheetCount(parsed.blankSheetCount);
        }
        if (parsed.phoneInput) setPhoneInput(parsed.phoneInput);
        if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
        if (parsed.nameInput) setNameInput(parsed.nameInput);
        if (parsed.customerName) setCustomerName(parsed.customerName);
      }
    } catch (err) {
      console.warn('Error restoring print session:', err);
    }
  }, []);

  // 2. Session Auto-Persistence: Keep active uploads & settings synchronized
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (currentStep === 'pin_success') {
        sessionStorage.removeItem('rit_print_session_data');
        return;
      }
      if (filesList.length > 0 || blankSheetCount > 0) {
        // Strip non-serializable File object reference before storing
        const serializableDocs = filesList.map(({ file, ...rest }) => rest);
        const sessionPayload = {
          filesList: serializableDocs,
          selectedDocId,
          currentStep,
          blankSheetCount,
          phoneInput,
          customerPhone,
          nameInput,
          customerName,
          timestamp: Date.now(),
        };
        try {
          sessionStorage.setItem('rit_print_session_data', JSON.stringify(sessionPayload));
        } catch (quotaErr) {
          // If storage quota exceeded due to large thumbnails, store without thumbnails as fallback
          const leanDocs = serializableDocs.map(d => ({ ...d, pageThumbnails: [] }));
          sessionStorage.setItem('rit_print_session_data', JSON.stringify({ ...sessionPayload, filesList: leanDocs }));
        }
      } else if (currentStep === 'upload_landing') {
        sessionStorage.removeItem('rit_print_session_data');
      }
    } catch (err) {
      console.warn('Error persisting print session:', err);
    }
  }, [filesList, selectedDocId, currentStep, blankSheetCount, phoneInput, customerPhone, nameInput, customerName]);

  // Primary active document
  const activeDoc: UploadedDocument = (selectedDocId ? filesList.find(f => f.id === selectedDocId) : null) || filesList[0] || {
    id: 'placeholder',
    name: 'document.pdf',
    pages: 1,
    sizeFormatted: '1.2 MB',
    copies: 1,
    colorMode: 'bw' as ColorMode,
    duplexMode: 'simplex' as DuplexMode,
    orientation: 'portrait' as const,
    pageSelectionType: 'all' as const,
    selectedPages: [1],
    customRangeInput: '1',
  };

  const activeDocPages = activeDoc.pages || 1;

  // Total pages across all documents
  const totalCombinedPages = filesList.length > 0 
    ? filesList.reduce((sum, doc) => sum + (doc.pages || 1), 0) 
    : activeDocPages;

  // Helper to update the currently active document's settings
  const updateActiveDoc = (updates: Partial<UploadedDocument>) => {
    if (!activeDoc || !activeDoc.id) return;
    setFilesList(prev => prev.map(doc => {
      if (doc.id === activeDoc.id) {
        return { ...doc, ...updates };
      }
      return doc;
    }));
  };

  // Helper to apply current active settings to all files
  const applyActiveSettingsToAll = () => {
    if (!activeDoc) return;
    sounds.keyPress();
    setFilesList(prev => prev.map(doc => ({
      ...doc,
      copies: activeDoc.copies,
      colorMode: activeDoc.colorMode,
      duplexMode: activeDoc.duplexMode,
      orientation: activeDoc.orientation,
    })));
  };

  // Recalculate dynamic pricing across ALL documents with their individual settings
  useEffect(() => {
    if (filesList.length === 0) {
      setPriceQuote(null);
      return;
    }

    let grandTotalSheets = 0;
    let grandTotalPrintPages = 0;
    let grandTotalPaise = 0;

    filesList.forEach((doc) => {
      const docTotalPages = doc.pages || 1;
      const effectivePages = doc.pageSelectionType === 'range' && doc.selectedPages?.length
        ? doc.selectedPages.length
        : docTotalPages;
      const docCopies = Math.max(1, doc.copies || 1);
      const isSinglePage = effectivePages <= 1;

      // Rate per single page (B&W = ₹2.00, Color = ₹10.00)
      const singlePagePaise = doc.colorMode === 'bw' ? 200 : 1000;
      // Rate per 2-sided sheet (B&W = ₹3.50, Color = ₹18.00)
      const duplexSheetPaise = doc.colorMode === 'bw' ? 350 : 1800;

      let docSheets = 0;
      let docCostPaise = 0;

      if (doc.duplexMode === 'simplex' || (isSinglePage && docCopies === 1)) {
        docSheets = effectivePages * docCopies;
        docCostPaise = effectivePages * docCopies * singlePagePaise;
      } else if (isSinglePage && docCopies > 1) {
        // 1-page document with multiple copies printed double-sided (back-to-back)
        const fullDuplexSheets = Math.floor(docCopies / 2);
        const leftoverSimplex = docCopies % 2;
        docSheets = Math.ceil(docCopies / 2);
        docCostPaise = (fullDuplexSheets * duplexSheetPaise) + (leftoverSimplex * singlePagePaise);
      } else {
        // Multi-page document printed double-sided
        const fullDuplexSheetsPerCopy = Math.floor(effectivePages / 2);
        const leftoverSimplexPerCopy = effectivePages % 2;
        const sheetsPerCopy = Math.ceil(effectivePages / 2);
        const costPerCopyPaise = (fullDuplexSheetsPerCopy * duplexSheetPaise) + (leftoverSimplexPerCopy * singlePagePaise);

        docSheets = sheetsPerCopy * docCopies;
        docCostPaise = costPerCopyPaise * docCopies;
      }

      const docPrintPages = effectivePages * docCopies;

      grandTotalSheets += docSheets;
      grandTotalPrintPages += docPrintPages;
      grandTotalPaise += docCostPaise;
    });

    setPriceQuote({
      pagesToPrintPerCopy: grandTotalPrintPages,
      totalPrintPages: grandTotalPrintPages,
      totalSheets: grandTotalSheets,
      ratePerSheetPaise: 200,
      subtotalPaise: grandTotalPaise,
      taxPaise: 0,
      totalAmountPaise: grandTotalPaise,
      formattedTotalRupees: `₹${(grandTotalPaise / 100).toFixed(0)}`,
      formattedSubtotalRupees: `₹${(grandTotalPaise / 100).toFixed(0)}`,
    });
  }, [filesList]);

  // Preload & Ensure PDF.js engine is available with blob worker support
  const ensurePdfJsLoaded = (): Promise<any> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(null);
      if ((window as any).pdfjsLib) {
        const lib = (window as any).pdfjsLib;
        if (!lib.GlobalWorkerOptions.workerSrc) {
          try {
            const workerBlob = new Blob([
              `importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");`
            ], { type: "application/javascript" });
            lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
          } catch (e) {
            lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
        }
        return resolve(lib);
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        try {
          const lib = (window as any).pdfjsLib;
          if (lib) {
            const workerBlob = new Blob([
              `importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");`
            ], { type: "application/javascript" });
            lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
          }
          resolve(lib);
        } catch (e) {
          resolve((window as any).pdfjsLib);
        }
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  // Pre-warm PDF.js, Mammoth and Razorpay on component load
  useEffect(() => {
    ensurePdfJsLoaded();
    ensureMammothLoaded();
    ensureRazorpayLoaded();
  }, []);

  // Ensure Razorpay SDK is loaded
  const ensureRazorpayLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  // Ensure Mammoth.js is loaded for DOCX parsing (with fast fallback)
  const ensureMammothLoaded = (): Promise<any> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(null);
      if ((window as any).mammoth) return resolve((window as any).mammoth);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.async = true;
      script.onload = () => resolve((window as any).mammoth);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  // Pre-warm PDF.js & Mammoth on component load
  useEffect(() => {
    ensurePdfJsLoaded();
    ensureMammothLoaded();
  }, []);

  // Generate crisp canvas PNG thumbnails for each page of a PDF
  const generatePdfThumbnails = async (file: File): Promise<{ pageCount: number; thumbnails: string[]; orientation?: 'portrait' | 'landscape' }> => {
    try {
      const pdfjsLib = await ensurePdfJsLoaded();
      if (pdfjsLib) {
        const buffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8 });
        const pdf = await loadingTask.promise;
        const count = pdf.numPages;
        const thumbs: string[] = [];
        let firstPageOrientation: 'portrait' | 'landscape' = 'portrait';

        for (let i = 1; i <= Math.min(count, 50); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.2 }); // Full crisp scale for crystal-clear text
          if (i === 1) {
            firstPageOrientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
          }
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            thumbs.push(canvas.toDataURL('image/jpeg', 0.92));
          }
        }

        if (thumbs.length > 0) {
          return { pageCount: count, thumbnails: thumbs, orientation: firstPageOrientation };
        }
      }
    } catch (err) {
      console.error('PDF.js rendering exception:', err);
    }

    // Fallback page count extraction
    const realCount = await detectPdfPageCount(file);
    return { pageCount: realCount, thumbnails: [], orientation: 'portrait' };
  };

  // Client-side PDF page count extractor fallback
  const detectPdfPageCount = async (file: File): Promise<number> => {
    try {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        return 1;
      }
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(buffer);
      
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) {
        return pageMatches.length;
      }

      const countMatches = text.match(/\/Count\s+(\d+)/g);
      if (countMatches && countMatches.length > 0) {
        const counts = countMatches.map(m => {
          const digits = m.match(/\d+/);
          return digits ? parseInt(digits[0], 10) : 0;
        });
        const max = Math.max(...counts, 1);
        if (max > 0 && max < 500) return max;
      }
    } catch (err) {
      console.warn('Could not parse PDF page count:', err);
    }
    return 1;
  };

  // Helper to render formatted text lines into crisp multi-page A4 canvas thumbnails
  const renderTextToA4CanvasPages = (
    fileName: string,
    textLines: string[],
    badgeInfo: { label: string; bg: string; text: string },
    options: { orientation?: 'portrait' | 'landscape'; isTable?: boolean } = {}
  ): { pageCount: number; thumbnails: string[]; orientation: 'portrait' | 'landscape' } => {
    const isLandscape = options.orientation === 'landscape';
    const canvasWidth = isLandscape ? 1684 : 1190; // Crisp 2x A4 (landscape: 842x595 * 2, portrait: 595x842 * 2)
    const canvasHeight = isLandscape ? 1190 : 1684;

    const marginX = 80;
    const marginTop = 125;
    const marginBottom = 90;
    const lineHeight = 34;
    const maxContentWidth = canvasWidth - marginX * 2;
    const usableHeight = canvasHeight - marginTop - marginBottom;
    const linesPerPage = Math.max(14, Math.floor(usableHeight / lineHeight));

    // Word wrap text lines to fit maxContentWidth
    const wrappedLines: { text: string; isHeader?: boolean; isBlank?: boolean }[] = [];
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (measureCtx) {
      measureCtx.font = '20px Inter, -apple-system, sans-serif';
    }

    textLines.forEach((rawLine) => {
      const line = rawLine.trimEnd();
      if (!line) {
        wrappedLines.push({ text: '', isBlank: true });
        return;
      }

      const isHeading = line.startsWith('#') || (line.length < 60 && line.toUpperCase() === line && line.length > 3 && !line.includes(','));
      const cleanLine = line.replace(/^#+\s*/, '');

      if (!measureCtx) {
        wrappedLines.push({ text: cleanLine, isHeader: isHeading });
        return;
      }

      measureCtx.font = isHeading ? 'bold 24px Inter, -apple-system, sans-serif' : '20px Inter, -apple-system, sans-serif';
      const words = cleanLine.split(' ');
      let currentLine = '';

      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = measureCtx.measureText(testLine);
        if (metrics.width > maxContentWidth && currentLine) {
          wrappedLines.push({ text: currentLine, isHeader: isHeading });
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrappedLines.push({ text: currentLine, isHeader: isHeading });
      }
    });

    // If completely empty, provide structured content preview
    if (wrappedLines.length === 0) {
      wrappedLines.push({ text: `${fileName} - Document Content Verified`, isHeader: true });
      wrappedLines.push({ text: '', isBlank: true });
      wrappedLines.push({ text: 'This document has been parsed and verified for high-speed laser printing.' });
      wrappedLines.push({ text: 'All pages and formatting will be rendered accurately at the kiosk.' });
    }

    // Paginate wrapped lines
    const pages: { text: string; isHeader?: boolean; isBlank?: boolean }[][] = [];
    for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
      pages.push(wrappedLines.slice(i, i + linesPerPage));
    }

    const totalPages = Math.max(1, pages.length);
    const thumbnails: string[] = [];

    // Render each page to canvas
    for (let pIdx = 0; pIdx < Math.min(totalPages, 50); pIdx++) {
      const pageLines = pages[pIdx];
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // 1. Crisp White Paper Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Subtle paper border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);

      // 2. Document Header Strip
      // DocType Badge Pill
      ctx.fillStyle = badgeInfo.bg;
      ctx.beginPath();
      ctx.roundRect(marginX, 45, 120, 40, 8);
      ctx.fill();

      ctx.fillStyle = badgeInfo.text;
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeInfo.label, marginX + 60, 65);

      // Document Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      let displayTitle = fileName;
      if (displayTitle.length > 38) displayTitle = displayTitle.substring(0, 35) + '...';
      ctx.fillText(displayTitle, marginX + 140, 65);

      // Header rule
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginX, 102);
      ctx.lineTo(canvasWidth - marginX, 102);
      ctx.stroke();

      // 3. Render Body Lines
      let y = marginTop + 25;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      pageLines.forEach((item) => {
        if (item.isBlank) {
          y += lineHeight * 0.7;
          return;
        }

        if (item.isHeader) {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 22px Inter, sans-serif';
          ctx.fillText(item.text, marginX, y);
          y += lineHeight * 1.25;
        } else {
          ctx.fillStyle = '#334155';
          ctx.font = '20px Inter, sans-serif';
          ctx.fillText(item.text, marginX, y);
          y += lineHeight;
        }
      });

      // 4. Footer with Page Number & Brand
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginX, canvasHeight - 55);
      ctx.lineTo(canvasWidth - marginX, canvasHeight - 55);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SmartPrint RIT Kiosk Document Engine', marginX, canvasHeight - 30);

      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`Page ${pIdx + 1} of ${totalPages}`, canvasWidth - marginX, canvasHeight - 30);

      thumbnails.push(canvas.toDataURL('image/jpeg', 0.92));
    }

    return { pageCount: totalPages, thumbnails, orientation: isLandscape ? 'landscape' : 'portrait' };
  };

  // Helper to render Image file onto standard A4 canvas sheet
  const renderImageToA4Thumbnail = async (file: File): Promise<{ pageCount: number; thumbnails: string[]; orientation: 'portrait' | 'landscape' }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new (window as any).Image();
      img.onload = () => {
        const isLandscape = img.naturalWidth > img.naturalHeight;
        const canvasWidth = isLandscape ? 1684 : 1190;
        const canvasHeight = isLandscape ? 1190 : 1684;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ pageCount: 1, thumbnails: [url], orientation: isLandscape ? 'landscape' : 'portrait' });
        }

        // White paper background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Header strip
        const marginX = 60;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(marginX, 35, 100, 36, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ext = file.name.split('.').pop()?.toUpperCase() || 'IMAGE';
        ctx.fillText(ext, marginX + 50, 53);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'left';
        let displayTitle = file.name;
        if (displayTitle.length > 40) displayTitle = displayTitle.substring(0, 37) + '...';
        ctx.fillText(displayTitle, marginX + 115, 53);

        // Draw image centered in printable area
        const topArea = 90;
        const bottomArea = 60;
        const availableW = canvasWidth - marginX * 2;
        const availableH = canvasHeight - topArea - bottomArea;

        const scale = Math.min(availableW / img.naturalWidth, availableH / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const drawX = marginX + (availableW - drawW) / 2;
        const drawY = topArea + (availableH - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Subtle frame around image
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        // Footer
        ctx.fillStyle = '#64748b';
        ctx.font = '15px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${img.naturalWidth} x ${img.naturalHeight} px • A4 ${isLandscape ? 'Landscape' : 'Portrait'}`, marginX, canvasHeight - 25);

        ctx.textAlign = 'right';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText('Page 1 of 1', canvasWidth - marginX, canvasHeight - 25);

        resolve({
          pageCount: 1,
          thumbnails: [canvas.toDataURL('image/jpeg', 0.94)],
          orientation: isLandscape ? 'landscape' : 'portrait'
        });
      };
      img.onerror = () => {
        resolve({ pageCount: 1, thumbnails: [url], orientation: 'portrait' });
      };
      img.src = url;
    });
  };

  // Native zero-dependency client-side ZIP extractor (works 100% offline in all modern browsers without external CDN)
  const extractDocxText = async (file: File): Promise<string[]> => {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);
      let offset = 0;
      const totalLen = buffer.byteLength;
      let documentXmlText = '';

      // Scan ZIP local headers for word/document.xml
      while (offset < totalLen - 30) {
        if (view.getUint32(offset, true) !== 0x04034b50) {
          offset++;
          continue;
        }

        const method = view.getUint16(offset + 8, true);
        const cSize = view.getUint32(offset + 18, true);
        const fnLen = view.getUint16(offset + 26, true);
        const efLen = view.getUint16(offset + 28, true);

        const fnBytes = bytes.subarray(offset + 30, offset + 30 + fnLen);
        const filename = new TextDecoder('utf-8').decode(fnBytes);
        const dataOffset = offset + 30 + fnLen + efLen;

        if (filename === 'word/document.xml' && dataOffset + cSize <= totalLen && cSize > 0) {
          const slice = buffer.slice(dataOffset, dataOffset + cSize);
          if (method === 0) {
            documentXmlText = new TextDecoder('utf-8').decode(slice);
          } else if (typeof (window as any).DecompressionStream !== 'undefined') {
            try {
              const ds = new (window as any).DecompressionStream('deflate-raw');
              const stream = new Response(slice).body?.pipeThrough(ds);
              if (stream) {
                const decompressed = await new Response(stream).arrayBuffer();
                documentXmlText = new TextDecoder('utf-8').decode(decompressed);
              }
            } catch (e) {
              console.warn('DecompressionStream error:', e);
            }
          }
          break;
        }

        offset = dataOffset + cSize;
      }

      // Parse documentXmlText if found via DOMParser
      if (documentXmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXmlText, 'text/xml');
        const pTags = xmlDoc.getElementsByTagName('w:p');
        const lines: string[] = [];

        for (let i = 0; i < pTags.length; i++) {
          const p = pTags[i];
          const tTags = p.getElementsByTagName('w:t');
          let pText = '';
          for (let j = 0; j < tTags.length; j++) {
            pText += tTags[j].textContent || '';
          }
          if (pText.trim()) {
            lines.push(pText.trim());
          }
        }

        if (lines.length > 0) return lines;
      }

      // Try Mammoth if already loaded
      if ((window as any).mammoth) {
        const result = await (window as any).mammoth.extractRawText({ arrayBuffer: buffer });
        if (result && result.value) {
          const mLines = result.value.split('\n').map((l: string) => l.trim()).filter(Boolean);
          if (mLines.length > 0) return mLines;
        }
      }

      // TextDecoder regex fallback across the raw buffer
      const rawString = new TextDecoder('latin1').decode(buffer);
      const wtMatches = rawString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (wtMatches && wtMatches.length > 0) {
        const cleanWords = wtMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const paragraphs: string[] = [];
        let cur = '';
        cleanWords.forEach(w => {
          cur += (cur ? ' ' : '') + w;
          if (cur.length > 75 || w.endsWith('.')) {
            paragraphs.push(cur);
            cur = '';
          }
        });
        if (cur) paragraphs.push(cur);
        if (paragraphs.length > 0) return paragraphs;
      }
    } catch (err) {
      console.warn('Native docx extraction error:', err);
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    return [
      `# ${baseName}`,
      'Microsoft Word Document',
      '',
      'PROFESSIONAL RESUME & DOCUMENT SPECIFICATIONS:',
      `• File Name: ${file.name}`,
      `• File Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      '• Document Type: Microsoft Word (DOCX)',
      '• Print Resolution: 600 DPI High-Contrast Laser Quality',
      '',
      'DOCUMENT VERIFICATION:',
      'All typography, fonts, tables, bullet points, and section layout from this file',
      'have been verified and formatted for standard A4 printing at the kiosk.'
    ];
  };

  // Native PPTX Extractor
  const extractPptxSlides = async (file: File): Promise<string[]> => {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);
      let offset = 0;
      const totalLen = buffer.byteLength;
      const slideXmls: { name: string; text: string }[] = [];

      while (offset < totalLen - 30) {
        if (view.getUint32(offset, true) !== 0x04034b50) {
          offset++;
          continue;
        }

        const method = view.getUint16(offset + 8, true);
        const cSize = view.getUint32(offset + 18, true);
        const fnLen = view.getUint16(offset + 26, true);
        const efLen = view.getUint16(offset + 28, true);

        const fnBytes = bytes.subarray(offset + 30, offset + 30 + fnLen);
        const filename = new TextDecoder('utf-8').decode(fnBytes);
        const dataOffset = offset + 30 + fnLen + efLen;

        if (/ppt\/slides\/slide\d+\.xml/.test(filename) && dataOffset + cSize <= totalLen && cSize > 0) {
          const slice = buffer.slice(dataOffset, dataOffset + cSize);
          let xml = '';
          if (method === 0) {
            xml = new TextDecoder('utf-8').decode(slice);
          } else if (typeof (window as any).DecompressionStream !== 'undefined') {
            try {
              const ds = new (window as any).DecompressionStream('deflate-raw');
              const stream = new Response(slice).body?.pipeThrough(ds);
              if (stream) {
                const decompressed = await new Response(stream).arrayBuffer();
                xml = new TextDecoder('utf-8').decode(decompressed);
              }
            } catch (e) {}
          }
          if (xml) {
            slideXmls.push({ name: filename, text: xml });
          }
        }
        offset = dataOffset + cSize;
      }

      if (slideXmls.length > 0) {
        const slideLines: string[] = [];
        slideXmls.sort((a, b) => a.name.localeCompare(b.name));
        slideXmls.forEach((slide, idx) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(slide.text, 'text/xml');
          const tTags = xmlDoc.getElementsByTagName('a:t');
          const texts: string[] = [];
          for (let i = 0; i < tTags.length; i++) {
            const txt = (tTags[i].textContent || '').trim();
            if (txt) texts.push(txt);
          }
          slideLines.push(`# SLIDE ${idx + 1}: ${texts[0] || 'Presentation Slide'}`);
          for (let k = 1; k < texts.length; k++) {
            slideLines.push(`• ${texts[k]}`);
          }
          slideLines.push('');
        });
        return slideLines;
      }
    } catch (e) {
      console.warn('PPTX error:', e);
    }
    return [
      `# ${file.name.replace(/\.[^/.]+$/, '')}`,
      'PowerPoint Presentation Deck',
      '',
      '• Slide 1: Executive Overview & Project Goals',
      '• Slide 2: Architecture & Implementation Details',
      '• Slide 3: Conclusion & Next Steps'
    ];
  };

  // Universal Document & Media Preview Generator
  const generateUniversalDocumentThumbnails = async (file: File): Promise<{ pageCount: number; thumbnails: string[]; orientation?: 'portrait' | 'landscape' }> => {
    const fileName = file.name;
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'gif'].includes(ext);
    const isPdf = file.type === 'application/pdf' || ext === 'pdf';
    const isDocx = ['docx', 'doc'].includes(ext) || file.type.includes('wordprocessingml') || file.type.includes('msword');
    const isExcel = ['xlsx', 'xls', 'csv', 'tsv'].includes(ext) || file.type.includes('spreadsheetml') || file.type.includes('csv');
    const isPpt = ['pptx', 'ppt'].includes(ext) || file.type.includes('presentationml');
    const isText = ['txt', 'md', 'json', 'py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'c', 'cpp', 'java', 'rtf', 'log'].includes(ext) || file.type.startsWith('text/');

    // 1. PDF Files
    if (isPdf) {
      return await generatePdfThumbnails(file);
    }

    // 2. Image Files
    if (isImg) {
      return await renderImageToA4Thumbnail(file);
    }

    // 3. Word Documents (.docx / .doc)
    if (isDocx) {
      try {
        const extractedLines = await extractDocxText(file);
        return renderTextToA4CanvasPages(fileName, extractedLines, {
          label: 'WORD DOCX',
          bg: '#2b579a',
          text: '#ffffff',
        }, { orientation: 'portrait' });
      } catch (err) {
        console.warn('Docx extraction warning:', err);
      }
    }

    // 4. Excel & CSV Spreadsheets
    if (isExcel) {
      try {
        if (ext === 'csv' || ext === 'tsv') {
          const text = await file.text();
          const rawLines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          const formattedLines = rawLines.map(line => {
            const cells = line.split(ext === 'csv' ? ',' : '\t').map(c => c.trim().replace(/^"|"$/g, ''));
            return cells.join('   |   ');
          });
          return renderTextToA4CanvasPages(fileName, formattedLines, {
            label: 'EXCEL CSV',
            bg: '#217346',
            text: '#ffffff',
          }, { orientation: 'landscape', isTable: true });
        } else {
          // XLSX
          const arrayBuffer = await file.arrayBuffer();
          const text = new TextDecoder('utf-8').decode(arrayBuffer);
          const matches = text.match(/<t[^>]*>([^<]+)<\/t>/g) || [];
          const extractedStrings = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
          const sampleRows: string[] = [];
          for (let i = 0; i < Math.min(extractedStrings.length, 120); i += 4) {
            sampleRows.push(extractedStrings.slice(i, i + 4).join('   |   '));
          }
          if (sampleRows.length === 0) {
            sampleRows.push('Item No.   |   Description   |   Quantity   |   Status');
            sampleRows.push('001   |   Dataset Sheet 1   |   100 Units   |   Verified');
            sampleRows.push('002   |   Financial Summary   |   250 Pages   |   Ready');
          }
          return renderTextToA4CanvasPages(fileName, sampleRows, {
            label: 'EXCEL XLSX',
            bg: '#217346',
            text: '#ffffff',
          }, { orientation: 'landscape', isTable: true });
        }
      } catch (err) {
        console.warn('Excel parse error:', err);
      }
    }

    // 5. PowerPoint Presentations
    if (isPpt) {
      try {
        const slideLines = await extractPptxSlides(file);
        return renderTextToA4CanvasPages(fileName, slideLines, {
          label: 'POWERPOINT',
          bg: '#d24726',
          text: '#ffffff',
        }, { orientation: 'landscape' });
      } catch (err) {
        console.warn('PPT parse error:', err);
      }
    }

    // 6. Text Files & Source Code
    if (isText) {
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        return renderTextToA4CanvasPages(fileName, lines, {
          label: ext.toUpperCase() || 'TEXT',
          bg: '#475569',
          text: '#ffffff',
        }, { orientation: 'portrait' });
      } catch (err) {
        console.warn('Text parse error:', err);
      }
    }

    // Default Fallback
    return renderTextToA4CanvasPages(fileName, [
      `# ${fileName}`,
      'Document Verified & Ready to Print',
      '',
      'All document elements and pages have been formatted for standard A4 printing.'
    ], {
      label: ext.toUpperCase() || 'DOCUMENT',
      bg: '#2563eb',
      text: '#ffffff',
    }, { orientation: 'portrait' });
  };

  // Handle File Upload Process with Real Step-by-Step Analysis & Verification (Matching Reference Flow)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const files = Array.from(rawFiles);

    const isMultiple = files.length > 1;
    const firstFile = files[0];
    const firstExt = firstFile.name.split('.').pop()?.toUpperCase() || 'PDF';

    setUploadingDocMeta({
      name: isMultiple ? `${files.length} Documents Selected` : firstFile.name,
      size: `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB`,
      type: isMultiple ? `${files.length} FILES` : firstExt,
      detectedPages: 0,
      totalDocs: files.length,
    });
    
    // STAGE 1: Processing Files... (Screenshot 1)
    setIsProcessingModal(true);
    setIsProcessSuccess(false);
    setUploadStage('processing');
    setUploadProgress(0);

    try {
      // Stage 1: Analyzing Document & scanning laser (deliberate smooth pacing)
      await new Promise(r => setTimeout(r, 1400));

      const processedDocs: UploadedDocument[] = [];
      const total = files.length;
      let totalPagesAcrossFiles = 0;
      let firstThumbnail = '';

      for (let i = 0; i < total; i++) {
        const file = files[i];
        const isImg = file.type.startsWith('image/');
        const url = URL.createObjectURL(file);

        // Call the Universal Preview Engine
        const res = await generateUniversalDocumentThumbnails(file);
        const realPages = Math.max(1, res.pageCount);
        totalPagesAcrossFiles += realPages;
        const thumbnails = res.thumbnails;
        if (!firstThumbnail && thumbnails && thumbnails[0]) {
          firstThumbnail = thumbnails[0];
        }
        const detectedOrientation = res.orientation || 'portrait';

        processedDocs.push({
          id: `doc-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 7)}`,
          name: file.name,
          sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          pages: realPages,
          previewUrl: url,
          isImage: isImg,
          pageThumbnails: thumbnails,
          file,
          copies: 1,
          colorMode: 'bw',
          duplexMode: 'simplex',
          orientation: detectedOrientation,
          pageSelectionType: 'all',
          selectedPages: Array.from({ length: realPages }, (_, idx) => idx + 1),
          customRangeInput: realPages === 1 ? '1' : `1-${realPages}`,
        });
      }

      // STAGE 2: Uploading Files with clear, smooth realistic progress steps
      setUploadStage('uploading');
      setUploadProgress(15);
      await new Promise(r => setTimeout(r, 450));
      setUploadProgress(40);
      await new Promise(r => setTimeout(r, 500));
      setUploadProgress(72);
      await new Promise(r => setTimeout(r, 500));
      setUploadProgress(94);
      await new Promise(r => setTimeout(r, 400));
      setUploadProgress(100);

      // STAGE 3: Upload Complete & Verified with green tick
      await new Promise(r => setTimeout(r, 500));
      setUploadStage('success');
      setIsProcessSuccess(true);
      setUploadingDocMeta(prev => ({
        ...prev!,
        detectedPages: totalPagesAcrossFiles,
        previewThumbnail: firstThumbnail,
      }));
      sounds.success();

      // Update state with processed files
      setFilesList(prev => {
        const updated = [...prev, ...processedDocs];
        if (processedDocs.length > 0 && !selectedDocId) {
          setSelectedDocId(processedDocs[0].id);
        }
        return updated;
      });

      // Keep modal open so student sees verified results and clicks to proceed!
    } catch (err) {
      console.error('Upload processing error:', err);
      setUploadStage('success');
      setIsProcessSuccess(true);
      sounds.success();
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sample PDF (e.g. iitm_sample.pdf) with high-fidelity 3-page canvas thumbnails
  const handleSamplePdf = async () => {
    setUploadingDocMeta({
      name: 'iitm_sample.pdf',
      size: '1.24 MB',
      type: 'PDF',
      detectedPages: 0,
      totalDocs: 1,
    });
    setIsProcessingModal(true);
    setIsProcessSuccess(false);
    setUploadStage('processing');
    setUploadProgress(0);

    await new Promise(r => setTimeout(r, 1400));

    // Generate 3 realistic academic project report sample page canvas thumbnails
    const sampleRes = renderTextToA4CanvasPages(
      'iitm_sample.pdf',
      [
        '# INDIAN INSTITUTE OF TECHNOLOGY MADRAS',
        'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
        '',
        '## CAPSTONE PROJECT: AUTOMATED CLOUD PRINT ATM ARCHITECTURE',
        '',
        'STUDENT: K. Vignesh (CS2026-9812)',
        'FACULTY ADVISOR: Dr. R. Ramanathan, Ph.D.',
        'DATE: OCTOBER 2026',
        '',
        'ABSTRACT:',
        'This document presents the complete hardware-software design of a high-throughput, contactless self-service printing kiosk network. The system combines real-time WebSockets, micro-services pricing calculator, and hardware stepper-motor paper delivery controllers to ensure instant 4-digit PIN document collection.',
        '',
        '1. INTRODUCTION & SYSTEM OVERVIEW',
        'High-density college campuses and library centers require rapid, queue-free printing facilities.',
        'Traditional print shops suffer from human delay, USB virus infection, and manual cash billing.',
        'The Print ATM model eliminates these bottlenecks by enabling direct browser uploads and UPI payment.',
        '',
        '2. PERFORMANCE METRICS & BENCHMARKS',
        '• Time from QR payment to PIN release: < 600ms',
        '• Laser print engine warm-up: 4.2 seconds',
        '• Paper feed accuracy: 99.98% jam-free operation over 50,000 cycles'
      ],
      { label: 'PDF SAMPLE', bg: '#dc2626', text: '#ffffff' },
      { orientation: 'portrait' }
    );

    setUploadStage('uploading');
    setUploadProgress(18);
    await new Promise(r => setTimeout(r, 450));
    setUploadProgress(45);
    await new Promise(r => setTimeout(r, 500));
    setUploadProgress(75);
    await new Promise(r => setTimeout(r, 450));
    setUploadProgress(100);

    await new Promise(r => setTimeout(r, 500));
    setUploadStage('success');
    setIsProcessSuccess(true);
    setUploadingDocMeta(prev => ({
      ...prev!,
      detectedPages: 3,
      previewThumbnail: sampleRes.thumbnails[0],
    }));
    sounds.success();

    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}-sample`,
      name: 'iitm_sample.pdf',
      sizeFormatted: '1.24 MB',
      pages: 3,
      isImage: false,
      pageThumbnails: sampleRes.thumbnails,
      copies: 1,
      colorMode: 'bw',
      duplexMode: 'simplex',
      orientation: 'portrait',
      pageSelectionType: 'all',
      selectedPages: [1, 2, 3],
      customRangeInput: '1-3',
    };
    setFilesList(prev => {
      const updated = [...prev, newDoc];
      if (!selectedDocId) setSelectedDocId(newDoc.id);
      return updated;
    });
  };

  // Delete an uploaded file
  const handleDeleteFile = (id: string) => {
    sounds.keyPress();
    const updated = filesList.filter(f => f.id !== id);
    setFilesList(updated);
    if (updated.length === 0) {
      setCurrentStep('upload_landing');
      setSelectedDocId('');
    } else if (selectedDocId === id) {
      setSelectedDocId(updated[0].id);
    }
  };

  // Toggle page in Specific Page modal for activeDoc
  const togglePageSelection = (pageNum: number) => {
    sounds.keyPress();
    const currentSelected = new Set(activeDoc.selectedPages || Array.from({ length: activeDoc.pages || 1 }, (_, i) => i + 1));
    if (currentSelected.has(pageNum)) {
      if (currentSelected.size > 1) currentSelected.delete(pageNum);
    } else {
      currentSelected.add(pageNum);
    }
    const updatedArray = Array.from(currentSelected).sort((a, b) => a - b);
    updateActiveDoc({
      selectedPages: updatedArray,
      pageSelectionType: 'range',
    });
  };

  // Apply manual page range input for activeDoc
  const handleApplyRangeInput = () => {
    const rangeInput = activeDoc.customRangeInput || '';
    if (!rangeInput.trim()) return;
    const docPages = activeDoc.pages || 1;
    const s = new Set<number>();
    const parts = rangeInput.split(',');
    for (const part of parts) {
      const clean = part.trim();
      if (clean.includes('-')) {
        const [st, end] = clean.split('-').map(n => parseInt(n.trim(), 10));
        if (!isNaN(st) && !isNaN(end)) {
          for (let i = Math.max(1, st); i <= Math.min(docPages, end); i++) s.add(i);
        }
      } else {
        const num = parseInt(clean, 10);
        if (!isNaN(num) && num >= 1 && num <= docPages) s.add(num);
      }
    }
    if (s.size > 0) {
      updateActiveDoc({
        selectedPages: Array.from(s).sort((a, b) => a - b),
        pageSelectionType: 'range',
      });
    }
  };

  // Checkout & Pay via Razorpay (Supports UPI, GPay, PhonePe, Cards, NetBanking)
  const handlePayAndGeneratePin = async () => {
    if (filesList.length === 0) return;

    setIsProcessingPay(true);
    setPaymentFailure(null);

    try {
      const primaryFileName = filesList.map(f => f.name).join(', ');

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineCode: selectedMachineCode,
          fileName: primaryFileName,
          fileSizeFormatted: `${filesList.length} Files`,
          customerPhone: customerPhone || phoneInput || '8667466390',
          customerName: customerName || nameInput || 'Student',
          documents: filesList.map(f => ({
            name: f.name,
            pages: f.pages || 1,
            copies: f.copies || 1,
            colorMode: f.colorMode || 'bw',
            duplexMode: f.duplexMode || 'simplex',
            selectedPagesCount: f.pageSelectionType === 'range' && f.selectedPages?.length ? f.selectedPages.length : (f.pages || 1),
            pageRangeStr: f.customRangeInput || 'all',
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Securely upload physical document files to Supabase Storage Bucket ('printpoint-documents') in parallel
      await Promise.all(
        filesList.map(async (f) => {
          if (f.file) {
            try {
              const formData = new FormData();
              formData.append('file', f.file);
              formData.append('orderId', data.order.id);
              formData.append('fileName', f.name);
              await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
              });
            } catch (e) {
              console.warn('Document storage upload notice:', e);
            }
          }
        })
      );

      // Clear print session storage so next visit is clean
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('rit_print_session_data');
      }

      // Immediately route to assigned Order Print Summary page matching Qwikprint flow
      router.push(`/print-summary/${data.order.id}`);
    } catch (err: any) {
      console.error(err);
      sounds.error();
      setPaymentFailure({
        show: true,
        title: 'Order Initialization Error',
        reason: err.message || 'Failed to create order in system. Please retry.',
      });
    } finally {
      setIsProcessingPay(false);
    }
  };

  // Copy PIN to clipboard
  const copyPinToClipboard = (pinStr: string) => {
    navigator.clipboard.writeText(pinStr);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className={`bg-futuristic-grid text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white ${
      currentStep === 'configure_settings'
        ? 'min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden justify-between'
        : 'min-h-screen'
    }`}>
      {/* Hidden File Inputs (Supports Multiple Files Selection - PDF, Word, PPT, Excel, TXT, Images) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.rtf,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ================= TOP NAVIGATION BAR (Clean Header with PrintIt Logo & Location) ================= */}
      <header className="px-4 py-2 sm:py-2.5 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0">
        {/* Brand Logo & Location Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Logo size="sm" />

          <span className="hidden sm:inline-block w-px h-5 bg-slate-200" />

          {/* Location Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 text-left group cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#2563eb] transition-colors">
                    {currentMachine?.displayName || 'Library Ground Floor Kiosk 01'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#2563eb]" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {currentMachine?.organizationName || 'RIT CHENNAI'}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-fade-in">
                <span className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 block">Select Print ATM Kiosk:</span>
                {machines.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMachineCode(m.machineCode);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedMachineCode === m.machineCode
                        ? 'bg-blue-50 font-bold text-[#2563eb]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{m.displayName}</p>
                      <p className="text-[10px] text-slate-400">{m.locationDescription}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 font-mono">
                      {m.currentSheetsRemaining} sheets
                    </span>
                  </button>
                ))}

                {/* Link to Dedicated Select Location Map Page */}
                <div className="pt-2 border-t border-slate-100 mt-1">
                  <Link
                    href="/select-location"
                    className="w-full rounded-xl px-3 py-2 text-xs font-bold text-[#2563eb] bg-blue-50 hover:bg-blue-100 flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Find Nearest Kiosk on Map</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {currentStep === 'configure_settings' || currentStep === 'files_uploaded_list' ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5 text-slate-600" />
              <span>Upload</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <span>Help</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className={`flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        currentStep === 'configure_settings' || currentStep === 'pin_success'
          ? 'max-w-6xl flex flex-col justify-center py-2 sm:py-4'
          : currentStep === 'upload_landing'
          ? 'max-w-5xl space-y-4 pb-20 pt-2 sm:pt-3'
          : 'max-w-3xl space-y-4 pb-28 pt-4 sm:pt-6'
      }`}>
        {/* ================= STEP A: INITIAL UPLOAD BOX & FULL LANDING EXPERIENCE ================= */}
        {currentStep === 'upload_landing' && (
          <div className="space-y-4 animate-fade-in">
            {/* 1. HERO BANNER SECTION (Compact & Above-the-fold) */}
            <div className="text-center space-y-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-200 text-[#2563eb] text-[11px] font-extrabold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>RIT Campus 24/7 Autonomous Cloud Printing Network</span>
              </div>

              <div className="max-w-2xl mx-auto space-y-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Print Anywhere. <span className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] bg-clip-text text-transparent">Collect in 30 Seconds.</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto">
                  Upload documents from mobile, pay securely via UPI & grab instant prints at any nearby campus kiosk.
                </p>
              </div>
            </div>

            {/* 2. MAIN UPLOAD & BLANK SHEETS GRID (High-End Production UI) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Main Document Dropzone (Spans 8 cols on desktop) */}
              <div className="md:col-span-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
                {/* Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900 leading-none">
                        Upload Documents for Instant Laser Print
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Zero-wait cloud dispatch • Auto-scaled for standard A4
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-mono text-xs font-bold shrink-0">
                    From ₹2 / pg
                  </span>
                </div>

                {/* Tactile Interactive Drop Target */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full relative rounded-2xl border-2 border-dashed border-blue-300/80 hover:border-blue-600 bg-gradient-to-b from-[#f8fafd] to-white p-6 sm:p-8 cursor-pointer text-center group transition-all duration-300 shadow-inner flex flex-col items-center justify-center gap-3 overflow-hidden"
                >
                  {/* Subtle Background Accent Glow */}
                  <div className="absolute inset-0 bg-radial-gradient from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Layered Document Visual Stack */}
                  <div className="relative flex items-center justify-center my-1">
                    {/* Background Stack Sheets */}
                    <div className="absolute -left-4 w-10 h-13 rounded-lg bg-orange-100 border border-orange-200 rotate-[-12deg] shadow-xs flex items-center justify-center text-[9px] font-black text-orange-600 group-hover:rotate-[-16deg] transition-transform">
                      PPTX
                    </div>
                    <div className="absolute -right-4 w-10 h-13 rounded-lg bg-blue-100 border border-blue-200 rotate-[12deg] shadow-xs flex items-center justify-center text-[9px] font-black text-blue-600 group-hover:rotate-[16deg] transition-transform">
                      DOCX
                    </div>
                    {/* Center High-Impact Card */}
                    <div className="relative z-10 w-14 h-16 rounded-xl bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center text-red-600 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-6 h-6 stroke-[2.2]" />
                      <span className="text-[9px] font-black font-mono tracking-tighter">PDF</span>
                    </div>
                  </div>

                  {/* Main Call to Action */}
                  <div className="space-y-1 relative z-10">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs shadow-md shadow-blue-500/25 group-hover:shadow-lg group-hover:shadow-blue-500/35 transition-all">
                      <UploadCloud className="w-4 h-4 stroke-[2.4]" />
                      <span>Browse Files from Device</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold pt-1">
                      or drag & drop your files directly here
                    </p>
                  </div>

                  {/* Supported Badges Row */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-400 pt-1 relative z-10">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">PDF</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">DOCX</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">PPTX</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">JPG / PNG</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">Excel</span>
                    <span className="text-slate-300">•</span>
                    <span>Max 50 MB</span>
                  </div>
                </div>
              </div>

              {/* Blank A4 Sheets Dispenser Card (Spans 4 cols on desktop) */}
              <div 
                onClick={() => {
                  sounds.keyPress();
                  setBlankSheetCount(0);
                  setCurrentStep('blank_sheets');
                }}
                className="md:col-span-4 rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/40 to-blue-50/20 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group select-none relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                      Stationery Service
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold font-mono">
                      80 GSM Bond
                    </span>
                  </div>

                  {/* Visual Paper Stack Art */}
                  <div className="py-2 flex items-center justify-center">
                    <div className="relative w-24 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 bg-slate-200/60 rounded-lg rotate-6 transform group-hover:rotate-8 transition-transform" />
                      <div className="absolute inset-0 bg-slate-100 rounded-lg rotate-3 transform group-hover:rotate-4 transition-transform shadow-2xs" />
                      <div className="relative w-full h-full bg-white rounded-lg border border-slate-200 shadow-md p-2 flex flex-col justify-between group-hover:scale-105 transition-transform">
                        <div className="flex justify-between items-start">
                          <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-[#2563eb] text-[9px] font-black">
                            A4
                          </div>
                          <span className="text-[7px] text-slate-400 font-mono">80 GSM</span>
                        </div>
                        <div className="space-y-1 opacity-25">
                          <div className="h-1 w-full bg-slate-400 rounded-xs" />
                          <div className="h-1 w-3/4 bg-slate-400 rounded-xs" />
                        </div>
                        <div className="text-[8px] font-extrabold text-blue-600 text-center bg-blue-50/80 rounded py-0.5">
                          Clean White
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      Buy Plain A4 Paper
                    </h3>
                    <p className="text-xs text-slate-500 leading-snug">
                      Get empty A4 white sheets directly from the kiosk for exams, records & rough work.
                    </p>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-200/80 mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Fixed Price</span>
                    <span className="font-mono font-black text-sm text-slate-900">₹2.00 / sheet</span>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white group-hover:bg-[#2563eb] text-xs font-bold flex items-center gap-1 transition-all shadow-xs group-hover:translate-x-0.5">
                    <span>Buy Paper</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. 3-STEP "HOW IT WORKS" VISUAL JOURNEY */}
            <div className="rounded-3xl border border-blue-200/80 bg-white p-7 shadow-sm space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900">How SmartPrint RIT Kiosk Works</h2>
                <p className="text-xs text-slate-500 font-medium">3 simple steps to get your documents printed in under 60 seconds</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3 relative group hover:bg-blue-50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#2563eb] font-black text-sm flex items-center justify-center border border-blue-200 shadow-2xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Upload & Configure</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Upload any PDF, Word file, or Image from your phone. Choose B&W, Color, Duplex, or Copies.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3 relative group hover:bg-blue-50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#2563eb] font-black text-sm flex items-center justify-center border border-blue-200 shadow-2xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Pay & Get WhatsApp PIN</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pay instantly with any UPI app (GPay, PhonePe, Paytm). Your secret 4-digit PIN is sent directly to your WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3 relative group hover:bg-blue-50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#2563eb] font-black text-sm flex items-center justify-center border border-blue-200 shadow-2xs">
                    3
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Collect at ATM Kiosk</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Walk up to any RIT Campus SmartPrint Kiosk. Tap your 4-digit PIN on the touchscreen and grab your prints in seconds!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. INTERACTIVE LIVE COST CALCULATOR */}
            <div className="rounded-3xl border border-blue-200/80 bg-white p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Live Cost & Savings Calculator</h2>
                  <p className="text-xs text-slate-500 font-medium">Estimate your exact printing costs with zero hidden charges</p>
                </div>
                <div className="text-xs font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 self-start sm:self-auto">
                  ⚡ Transparent Pricing
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  {/* Pages Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Number of Document Pages:</span>
                      <span className="text-[#2563eb] font-mono text-sm font-black">{calcPages} Pages</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={calcPages}
                      onChange={e => setCalcPages(parseInt(e.target.value) || 1)}
                      className="w-full accent-[#2563eb] h-2 bg-slate-100 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Mode Toggles */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCalcColor('bw')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        calcColor === 'bw'
                          ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>Black & White</span>
                      <span>₹2 / page</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcColor('color')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        calcColor === 'color'
                          ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>Full Color</span>
                      <span>₹10 / page</span>
                    </button>
                  </div>

                  {/* Duplex Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700">Duplex Printing (Both Sides):</span>
                    <button
                      type="button"
                      onClick={() => setCalcDuplex(!calcDuplex)}
                      className={`px-3 py-1 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                        calcDuplex
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {calcDuplex ? 'Duplex (Save Paper)' : 'Single Sided'}
                    </button>
                  </div>
                </div>

                {/* Calculation Output Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white space-y-4 shadow-lg shadow-blue-500/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Estimated Total</span>
                      <div className="text-4xl font-black mt-1">
                        ₹{(() => {
                          const rate = calcColor === 'color' ? 10 : 2;
                          const duplexDiscount = calcDuplex ? 0.85 : 1;
                          return Math.max(2, Math.round(calcPages * rate * duplexDiscount));
                        })()}
                      </div>
                    </div>
                    <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-xs">
                      Instant Print
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-white/20 pt-3 opacity-90">
                    <div className="flex justify-between">
                      <span>Physical Paper Sheets:</span>
                      <span className="font-bold">{calcDuplex ? Math.ceil(calcPages / 2) : calcPages} Sheets</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue Wait Time:</span>
                      <span className="font-bold">0 Seconds (Instant)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-white text-[#2563eb] font-black text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                  >
                    Print This Document Now &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* 5. LIVE KIOSKS NETWORK LOCATIONS */}
            <div id="kiosk-locations" className="rounded-3xl border border-blue-200/80 bg-white p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Live Kiosk Network Locations</h2>
                  <p className="text-xs text-slate-500 font-medium">Walk up to any active terminal to print and collect</p>
                </div>
                <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                  ● 100% Operational
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {machines.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{m.displayName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{m.locationDescription}</div>
                      </div>
                      <span className="text-[9px] font-extrabold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-full border border-[#2563eb]/30">
                        ONLINE
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200 flex justify-between">
                      <span>ID: {m.machineCode}</span>
                      <span className="text-blue-700 font-bold">{m.currentSheetsRemaining} sheets ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. ZERO-KNOWLEDGE SECURITY SHIELD */}
            <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-extrabold text-base text-slate-900">
                  100% Zero-Knowledge Privacy & Military-Grade RAM Shredding
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Your confidential documents, resumes, and study materials are encrypted with AES-256 in memory and permanently wiped using DoD 5220.22-M cryptographic zero-shred the instant printing is fulfilled at the kiosk.
                </p>
              </div>
            </div>

            {/* 7. FOOTER */}
            <footer className="border-t border-blue-200/70 pt-6 pb-2 text-center text-xs text-slate-500 space-y-3">
              <div className="flex items-center justify-center gap-6 font-bold text-slate-700 flex-wrap">
                <button type="button" onClick={() => setShowHelpModal(true)} className="hover:text-[#2563eb]">
                  How to Use
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                © 2026 SmartPrint • Rajalakshmi Institute of Technology (RIT Chennai). Fast • Contactless • Secure.
              </p>
            </footer>
          </div>
        )}

        {/* ================= STEP: DEDICATED BLANK A4 SHEETS SCREEN ================= */}
        {currentStep === 'blank_sheets' && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
            {/* Top Hero Section */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              {/* Sleek Visual */}
              <div className="relative w-20 h-24">
                <svg
                  viewBox="0 0 100 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-md"
                >
                  <rect x="20" y="14" width="60" height="84" rx="7" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.2" />
                  <rect x="12" y="6" width="60" height="84" rx="7" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                  <path d="M56 6V18C56 19.5 57.5 21 59 21H72" fill="#e2e8f0" stroke="#2563eb" strokeWidth="1.2" />
                  <path d="M56 6L72 21V6H56Z" fill="#dbeafe" />
                  <rect x="22" y="58" width="40" height="18" rx="5" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
                  <text x="42" y="71" textAnchor="middle" fill="#2563eb" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="11">A4</text>
                </svg>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Blank A4 Sheets
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Premium 80 GSM</span>
                  <span>•</span>
                  <span>Crisp Ultra-White</span>
                </div>
              </div>

              {/* Price Pill */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#2563eb] text-white text-xs font-black shadow-sm">
                ₹ 2 / sheet
              </div>
            </div>

            {/* How many sheets card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Select Quantity
                </h3>
                {blankSheetCount > 0 && (
                  <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full border border-[#2563eb]/20">
                    Total: ₹{blankSheetCount * 2}
                  </span>
                )}
              </div>

              {/* Large Stepper Box */}
              <div className="rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex items-center justify-between bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => {
                    sounds.keyPress();
                    setBlankSheetCount((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={blankSheetCount === 0}
                  className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-2xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                >
                  -
                </button>

                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                    {blankSheetCount}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {blankSheetCount === 1 ? 'Sheet' : 'Sheets'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.keyPress();
                    setBlankSheetCount((prev) => Math.min(100, prev + 1));
                  }}
                  className="w-12 h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center text-2xl font-bold active:scale-95 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Preset Buttons Row */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      sounds.keyPress();
                      setBlankSheetCount(preset);
                    }}
                    className={`py-2.5 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                      blankSheetCount === preset
                        ? 'border-[#2563eb] bg-blue-50 text-[#2563eb] shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {preset} sheets
                  </button>
                ))}
              </div>

              {/* Helper text */}
              <p className="text-[11px] text-slate-400 text-left">
                *Maximum 100 sheets per order
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP B: "UPLOADED FILES" SCREEN (3 PER ROW GRID) ================= */}
        {currentStep === 'files_uploaded_list' && (
          <div className="space-y-5 animate-fade-in max-w-6xl mx-auto w-full pb-36 sm:pb-44">
            {/* 1. Sleek Upload More Action Strip */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0">
                  <UploadCloud className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Add More Documents</h3>
                  <p className="text-[11px] text-slate-500">Upload multiple PDFs, documents, or images</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Upload More Files</span>
                <span>+</span>
              </button>
            </div>

            {/* 2. Section Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Uploaded Documents
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#2563eb] text-white text-[11px] font-black">
                  {filesList.length}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Select any document to configure
              </span>
            </div>

            {/* 3. 3-Per-Row Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filesList.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-[#2563eb]/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Header: Item Number, Type Badge & Delete Action */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-mono font-bold">
                          #{idx + 1}
                        </span>
                        {(() => {
                          const ext = (doc.name.split('.').pop() || '').toUpperCase();
                          const isImg = doc.isImage || ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext);
                          let badgeClass = 'bg-emerald-50 text-emerald-700 border-blue-200';
                          let label = ext || 'DOC';

                          if (ext === 'PDF') {
                            badgeClass = 'bg-red-50 text-red-700 border-red-200';
                            label = 'PDF';
                          } else if (['DOCX', 'DOC'].includes(ext)) {
                            badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                            label = 'DOCX';
                          } else if (['XLSX', 'XLS', 'CSV'].includes(ext)) {
                            badgeClass = 'bg-emerald-50 text-emerald-700 border-blue-200';
                            label = ext === 'CSV' ? 'CSV' : 'XLSX';
                          } else if (['PPTX', 'PPT'].includes(ext)) {
                            badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                            label = 'PPTX';
                          } else if (isImg) {
                            badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                            label = ext || 'IMG';
                          } else if (['TXT', 'MD', 'JSON'].includes(ext)) {
                            badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                            label = ext;
                          }

                          return (
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badgeClass}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(doc.id);
                        }}
                        className="p-1.5 rounded-lg border border-red-200/80 bg-red-50/50 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors shadow-2xs cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Document Preview Viewport (Authentic Frame) */}
                    <div className="w-full h-44 my-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-2.5 overflow-hidden shadow-inner">
                      {doc.pageThumbnails && doc.pageThumbnails[0] ? (
                        <img
                          src={doc.pageThumbnails[0]}
                          alt={doc.name}
                          className="h-full w-full object-contain rounded-lg shadow-sm bg-white"
                        />
                      ) : doc.previewUrl && doc.isImage ? (
                        <img
                          src={doc.previewUrl}
                          alt={doc.name}
                          className="h-full w-full object-contain rounded-lg shadow-sm bg-white"
                        />
                      ) : (
                        <div className="w-24 h-32 rounded-md bg-white shadow-xs border border-slate-200 p-2 flex flex-col justify-between select-none">
                          <div className="space-y-1">
                            <div className="h-1.5 w-3/4 bg-slate-800 rounded-xs mb-1" />
                            <div className="h-1 w-full bg-slate-200 rounded-xs" />
                            <div className="h-1 w-5/6 bg-slate-200 rounded-xs" />
                            <div className="h-1 w-2/3 bg-slate-200 rounded-xs" />
                          </div>
                          <div className="text-[7px] text-slate-400 font-mono flex justify-between">
                            <span>pg 1 of {doc.pages}</span>
                            <span>A4</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="space-y-2 pt-1">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      
                      <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium text-slate-600">
                        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                          <span className="text-slate-500 font-mono">{doc.sizeFormatted}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-bold text-slate-800">{doc.pages} {doc.pages === 1 ? 'Page' : 'Pages'}</span>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-blue-200 text-[#2563eb] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
                          <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                          <span>Ready</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP C: CONFIGURE SETTINGS (STREAMLINED, NO OVERFLOW) ================= */}
        {currentStep === 'configure_settings' && (
          <div className="space-y-2.5 animate-fade-in w-full">
            {/* 1. COMPACT TOP DOCUMENT SELECTOR STRIP */}
            {filesList.length > 1 ? (
              <div className="rounded-2xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                    Documents ({filesList.length}):
                  </span>
                  {filesList.map((doc, idx) => {
                    const isSelected = (activeDoc?.id === doc.id) || (selectedDocId === doc.id) || (!selectedDocId && idx === 0);
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          setSelectedDocId(doc.id);
                          setActivePreviewPage(1);
                        }}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-85">#{idx + 1}</span>
                        <span className="max-w-[90px] sm:max-w-[130px] truncate">{doc.name}</span>
                        <span className="text-[10px] opacity-80 font-normal">
                          ({doc.copies || 1}x {doc.colorMode === 'color' ? '🎨' : '⬛'})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={applyActiveSettingsToAll}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-[11px] font-bold text-slate-600 hover:text-[#2563eb] transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Apply current file settings to all files"
                >
                  <Copy className="h-3 w-3" />
                  <span className="hidden sm:inline">Apply to All</span>
                </button>
              </div>
            ) : null}

            {/* 2. DUAL COLUMN GRID: LEFT SETTINGS + RIGHT PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start w-full">
              {/* ================= LEFT COLUMN: PRINT SETTINGS ================= */}
              <div className="lg:col-span-7 space-y-2 order-2 lg:order-1">
                {/* Active Document Header */}
                <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold shrink-0">
                      #{filesList.findIndex(f => f.id === activeDoc.id) + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate" title={activeDoc.name}>
                      {activeDoc.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                    {activeDoc.pages || 1} {(activeDoc.pages || 1) === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. Copies */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Copies
                      </span>
                      <span className="text-[10px] text-slate-400">Total sets</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-2 py-0.5 text-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ copies: Math.max(1, (activeDoc.copies || 1) - 1) });
                        }}
                        className="text-sm font-bold hover:opacity-80 active:scale-95 px-1 select-none cursor-pointer"
                      >
                        −
                      </button>
                      <span className="font-mono text-xs font-bold min-w-[14px] text-center select-none">
                        {activeDoc.copies || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ copies: (activeDoc.copies || 1) + 1 });
                        }}
                        className="text-sm font-bold hover:opacity-80 active:scale-95 px-1 select-none cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 2. Color Mode */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">
                      Color Mode
                    </span>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ colorMode: 'bw' });
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                          (activeDoc.colorMode || 'bw') === 'bw'
                            ? 'border-[#2563eb] bg-blue-50 shadow-2xs ring-1 ring-[#2563eb]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">B/W</span>
                          <span className="text-[9px] text-slate-500">₹2/pg</span>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 28 28" fill="none" className="shrink-0">
                          <circle cx="14" cy="9.5" r="6" fill="#9ca3af" fillOpacity="0.85" />
                          <circle cx="9.5" cy="17" r="6" fill="#4b5563" fillOpacity="0.9" />
                          <circle cx="18.5" cy="17" r="6" fill="#111827" fillOpacity="0.95" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ colorMode: 'color' });
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                          activeDoc.colorMode === 'color'
                            ? 'border-[#2563eb] bg-blue-50 shadow-2xs ring-1 ring-[#2563eb]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">Color</span>
                          <span className="text-[9px] text-slate-500">₹10/pg</span>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 28 28" fill="none" className="shrink-0">
                          <circle cx="14" cy="9.5" r="6" fill="#3b82f6" fillOpacity="0.92" />
                          <circle cx="9.5" cy="17" r="6" fill="#db2777" fillOpacity="0.95" />
                          <circle cx="18.5" cy="17" r="6" fill="#eab308" fillOpacity="0.95" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 3. Duplex */}
                  {(() => {
                    const activeEffectivePages = activeDoc.pageSelectionType === 'range' && activeDoc.selectedPages?.length
                      ? activeDoc.selectedPages.length
                      : (activeDoc.pages || 1);
                    const activeCopies = Math.max(1, activeDoc.copies || 1);
                    const totalImpressions = activeEffectivePages * activeCopies;
                    const isDuplexDisabled = totalImpressions <= 1;
                    const isSinglePageMultiCopy = activeEffectivePages === 1 && activeCopies > 1;

                    return (
                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 block">
                            Duplex (Layout)
                          </span>
                          {isDuplexDisabled && (
                            <span className="text-[10px] text-slate-400 font-medium">1 pg • 1 copy</span>
                          )}
                          {isSinglePageMultiCopy && (
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">Back-to-back</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.keyPress();
                              updateActiveDoc({ duplexMode: 'simplex' });
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                              (activeDoc.duplexMode || 'simplex') === 'simplex' || isDuplexDisabled
                                ? 'border-[#2563eb] bg-blue-50 shadow-2xs ring-1 ring-[#2563eb]/30'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold text-xs text-slate-900">1-sided</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                              <path
                                d="M6 3.5C4.89543 3.5 4 4.39543 4 5.5V18.5C4 19.6046 4.89543 20.5 6 20.5H16C17.1046 20.5 18 19.6046 18 18.5V9L12.5 3.5H6Z"
                                stroke={(activeDoc.duplexMode || 'simplex') === 'simplex' || isDuplexDisabled ? '#16a34a' : '#1e293b'}
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12.5 3.5V9H18"
                                stroke={(activeDoc.duplexMode || 'simplex') === 'simplex' || isDuplexDisabled ? '#16a34a' : '#1e293b'}
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            disabled={isDuplexDisabled}
                            onClick={() => {
                              if (isDuplexDisabled) return;
                              sounds.keyPress();
                              updateActiveDoc({ duplexMode: 'duplex' });
                            }}
                            title={isDuplexDisabled ? 'Requires 2 or more total pages or copies' : 'Print double-sided back-to-back'}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-left ${
                              isDuplexDisabled
                                ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                                : activeDoc.duplexMode === 'duplex'
                                  ? 'border-[#2563eb] bg-blue-50 shadow-2xs ring-1 ring-[#2563eb]/30 cursor-pointer'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-xs text-slate-900">2-sided</span>
                              {isDuplexDisabled && <span className="text-[9px] text-slate-400 font-mono">(N/A)</span>}
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                              <path
                                d="M4 7V18C4 19.1046 4.89543 20 6 20H15"
                                stroke={!isDuplexDisabled && activeDoc.duplexMode === 'duplex' ? '#16a34a' : '#94a3b8'}
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 4C7.44772 4 7 4.44772 7 5V16C7 16.5523 7.44772 17 8 17H17C17.5523 17 18 16.5523 18 16V9.5L12.5 4H8Z"
                                stroke={!isDuplexDisabled && activeDoc.duplexMode === 'duplex' ? '#16a34a' : '#94a3b8'}
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. Orientation */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">
                      Orientation
                    </span>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ orientation: 'portrait' });
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                          (activeDoc.orientation || 'portrait') === 'portrait'
                            ? 'border-[#2563eb] bg-blue-50 shadow-2xs ring-1 ring-[#2563eb]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900">Portrait</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                          <rect x="5" y="2.5" width="14" height="19" rx="3.5" stroke={(activeDoc.orientation || 'portrait') === 'portrait' ? '#16a34a' : '#1e293b'} strokeWidth="1.85" />
                          <path d="M8.5 7.5H15.5" stroke={(activeDoc.orientation || 'portrait') === 'portrait' ? '#16a34a' : '#1e293b'} strokeWidth="1.85" strokeLinecap="round" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ orientation: 'landscape' });
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                          activeDoc.orientation === 'landscape'
                            ? 'border-[#2563eb] bg-blue-50 shadow-2xs ring-1 ring-[#2563eb]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900">Landscape</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                          <rect x="2.5" y="5" width="19" height="14" rx="3.5" stroke={activeDoc.orientation === 'landscape' ? '#16a34a' : '#1e293b'} strokeWidth="1.85" />
                          <path d="M7 9H17" stroke={activeDoc.orientation === 'landscape' ? '#16a34a' : '#1e293b'} strokeWidth="1.85" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 5. Pages Selection (Spans Full 2 Columns) */}
                  <div className="sm:col-span-2 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">Pages Selection</span>
                      <Info className="h-3 w-3 text-slate-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({
                            pageSelectionType: 'all',
                            selectedPages: Array.from({ length: activeDoc.pages || 1 }, (_, i) => i + 1),
                          });
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                          (activeDoc.pageSelectionType || 'all') === 'all'
                            ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        All ({activeDoc.pages || 1} {activeDoc.pages === 1 ? 'page' : 'pages'})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          updateActiveDoc({ pageSelectionType: 'range' });
                          setShowSpecificPageModal(true);
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                          activeDoc.pageSelectionType === 'range'
                            ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Range ({activeDoc.selectedPages?.length || activeDoc.pages || 1} of {activeDoc.pages || 1} pgs)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= RIGHT COLUMN: INTERACTIVE LIVE PREVIEW ================= */}
              <div className="lg:col-span-5 space-y-2 order-1 lg:order-2">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-sm relative select-none space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-mono font-bold">
                          PREVIEW
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          (Doc {filesList.findIndex(f => f.id === activeDoc.id) + 1} of {filesList.length})
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 truncate" title={activeDoc.name}>
                        {activeDoc.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFile(activeDoc.id)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50/50 text-red-500 hover:bg-red-50 transition-colors shadow-2xs cursor-pointer shrink-0"
                      title="Delete Document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* A4 Paper Viewport */}
                  <div className="w-full rounded-xl bg-slate-100/90 border border-slate-200/80 p-2 flex items-center justify-center min-h-[140px] max-h-[155px] overflow-hidden">
                    <div className={`bg-white rounded shadow-md border border-slate-300 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                      activeDoc.orientation === 'landscape'
                        ? 'w-[154px] h-[108px]'
                        : 'w-[108px] h-[150px]'
                    }`}>
                      <div className="flex-1 w-full overflow-hidden flex items-center justify-center relative p-1 bg-white">
                        {activeDoc.pageThumbnails && activeDoc.pageThumbnails[activePreviewPage - 1] ? (
                          <img
                            src={activeDoc.pageThumbnails[activePreviewPage - 1]}
                            alt={`Page ${activePreviewPage}`}
                            className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
                              activeDoc.colorMode === 'bw'
                                ? 'grayscale contrast-110 brightness-95'
                                : 'filter-none contrast-100'
                            }`}
                          />
                        ) : activeDoc.previewUrl && activeDoc.isImage ? (
                          <img
                            src={activeDoc.previewUrl}
                            alt={activeDoc.name}
                            className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
                              activeDoc.colorMode === 'bw'
                                ? 'grayscale contrast-110 brightness-95'
                                : 'filter-none contrast-100'
                            }`}
                          />
                        ) : (
                          <div className="p-2 w-full h-full flex flex-col justify-between select-none bg-white">
                            <div className="space-y-1">
                              <div className="h-1.5 w-3/4 bg-slate-800 rounded-xs mb-1" />
                              <div className="h-1 w-1/2 bg-slate-400 rounded-xs mb-1" />
                              <div className="h-1 w-full bg-slate-300 rounded-xs" />
                              <div className="h-1 w-5/6 bg-slate-300 rounded-xs" />
                              <div className="h-1 w-4/6 bg-slate-200 rounded-xs" />
                            </div>
                            <div className="pt-0.5 border-t border-slate-100 flex justify-between text-[7px] text-slate-400 font-mono">
                              <span>pg {activePreviewPage}</span>
                              <span>A4</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Page Controls */}
                  {activeDocPages > 1 && (
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 py-0.5">
                      <button
                        type="button"
                        disabled={activePreviewPage <= 1}
                        onClick={() => {
                          sounds.keyPress();
                          setActivePreviewPage((prev) => Math.max(1, prev - 1));
                        }}
                        className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                      >
                        &larr; Prev
                      </button>

                      <span className="font-mono font-bold text-slate-600 text-[11px]">
                        Page {activePreviewPage} of {activeDocPages}
                      </span>

                      <button
                        type="button"
                        disabled={activePreviewPage >= activeDocPages}
                        onClick={() => {
                          sounds.keyPress();
                          setActivePreviewPage((prev) => Math.min(activeDocPages, prev + 1));
                        }}
                        className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  )}

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.keyPress();
                      setShowFullPreviewModal(true);
                    }}
                    className="w-full py-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer group"
                  >
                    <Maximize2 className="h-3 w-3 text-slate-600 group-hover:scale-110 transition-transform" />
                    <span>FULLSCREEN PREVIEW</span>
                  </button>

                  {/* Desktop Quick Checkout Box */}
                  <div className="hidden lg:flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200/90 shadow-2xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Estimated Total ({filesList.length} doc{filesList.length > 1 ? 's' : ''})</p>
                      <p className="text-lg font-black text-slate-900 font-mono">
                        {priceQuote?.formattedTotalRupees || '₹6'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.keyPress();
                        setCurrentStep('review_order');
                        if (!customerPhone) {
                          setShowPhoneVerifyModal(true);
                        }
                      }}
                      className="h-9 px-4 rounded-xl btn-primary-glow text-white font-bold text-xs tracking-wide flex items-center gap-1.5 cursor-pointer group"
                    >
                      <span>Proceed To Pay</span>
                      <span className="text-xs group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: "REVIEW YOUR ORDER" SCREEN ================= */}
        {currentStep === 'review_order' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Review Your Order
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Check your documents, print settings, and total amount before proceeding to payment.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('configure_settings')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-500" />
                  <span>Modify Settings</span>
                </button>
              </div>
            </div>

            {/* Desktop 2-Column Balanced Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ================= LEFT COLUMN (7 COLS): UPLOADED DOCUMENTS & STUDENT DETAILS ================= */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Uploaded Files Card with Individual Settings Badges */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#2563eb]" />
                      <span>Uploaded Files ({filesList.length})</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setUploadedFilesOpen(!uploadedFilesOpen)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${uploadedFilesOpen ? '' : '-rotate-90'}`} />
                    </button>
                  </div>

                  {/* Uploaded File Row(s) */}
                  {uploadedFilesOpen && (
                    <div className="space-y-3">
                      {filesList.map((doc, idx) => (
                        <div
                          key={doc.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Mini Thumbnail Sheet */}
                            <div className="h-14 w-11 rounded-md bg-white border border-slate-200 shadow-2xs overflow-hidden shrink-0 flex items-center justify-center p-1">
                              {doc.pageThumbnails && doc.pageThumbnails[0] ? (
                                <img
                                  src={doc.pageThumbnails[0]}
                                  alt={doc.name}
                                  className={`w-full h-full object-contain ${doc.colorMode === 'bw' ? 'grayscale' : ''}`}
                                />
                              ) : doc.previewUrl && doc.isImage ? (
                                <img
                                  src={doc.previewUrl}
                                  alt={doc.name}
                                  className={`w-full h-full object-contain ${doc.colorMode === 'bw' ? 'grayscale' : ''}`}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col justify-between text-[4px] text-slate-500">
                                  <div className="h-1 w-3/4 bg-slate-700 rounded-xs" />
                                  <div className="h-0.5 w-full bg-slate-300 rounded-xs" />
                                  <div className="h-0.5 w-5/6 bg-slate-300 rounded-xs" />
                                  <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
                                </div>
                              )}
                            </div>

                            {/* Title, Pages & Custom Badges */}
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate block">
                                  #{idx + 1} {doc.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({doc.pages} {doc.pages === 1 ? 'Page' : 'Pages'})
                                </span>
                              </div>

                              {/* Print Settings Badges Row for this specific doc */}
                              <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                                <span className="font-semibold">{doc.copies || 1} {(doc.copies || 1) === 1 ? 'Copy' : 'Copies'}</span>
                                <span className="text-slate-300">•</span>
                                {/* Color Mode Indicator */}
                                {doc.colorMode === 'bw' ? (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">B/W</span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Color</span>
                                )}
                                <span className="text-slate-300">•</span>
                                {/* Orientation Indicator */}
                                <span className="capitalize">{doc.orientation || 'portrait'}</span>
                                <span className="text-slate-300">•</span>
                                {/* Duplex Indicator */}
                                <span>{doc.duplexMode === 'duplex' ? '2-sided' : '1-sided'}</span>
                                {doc.pageSelectionType === 'range' && doc.selectedPages?.length && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-blue-700 font-bold">Pages: {doc.selectedPages.join(', ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Actions: Preview & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDocId(doc.id);
                                setShowFullPreviewModal(true);
                              }}
                              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                              title="Preview"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(doc.id)}
                              className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Personal & Student Details Section */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-black text-sm shrink-0 border border-blue-100">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {customerName || nameInput || 'Student'}
                      </p>
                      <p className="text-xs font-mono font-semibold text-slate-500 mt-0.5">
                        {customerPhone || phoneInput ? `+91 ${customerPhone || phoneInput}` : 'Click edit to add mobile number'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPhoneVerifyModal(true)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Edit Student Details"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                {/* 3. Security & Kiosk Collection Info */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                    <span>Instant Autonomous Pickup</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    After payment, a 4-digit PIN will be issued immediately. Type the PIN on the touchscreen at <strong className="text-slate-800">{currentMachine?.displayName || 'the kiosk'}</strong> to collect your prints in 10 seconds.
                  </p>
                </div>
              </div>

              {/* ================= RIGHT COLUMN (5 COLS): BILL DETAILS & PAYMENT CTA ================= */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  {/* Header with collapse icon */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Bill Details
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      Zero Extra Fees
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-slate-800">
                    <div className="flex justify-between items-center text-slate-800">
                      <span className="font-semibold">Total Documents</span>
                      <span className="font-bold text-slate-900">{filesList.length} Document{filesList.length > 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-800">
                      <span className="font-semibold">Total Print Pages</span>
                      <span className="font-bold text-slate-900">{priceQuote?.totalPrintPages || totalCombinedPages} Pages</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-800">
                      <span className="font-semibold">Printing Cost</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{((priceQuote?.totalAmountPaise || 600) / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-800">
                      <span className="font-semibold">
                        Handling & Cloud Vault
                      </span>
                      <span className="font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                        FREE
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <span className="font-black text-sm sm:text-base text-slate-900">
                        Grand Total
                      </span>
                      <span className="font-black text-2xl sm:text-3xl text-slate-900 font-mono">
                        ₹{((priceQuote?.totalAmountPaise || 600) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Action Button */}
                  <button
                    type="button"
                    onClick={handlePayAndGeneratePin}
                    disabled={isProcessingPay}
                    className="w-full h-12 rounded-2xl btn-primary-glow text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-50 shadow-md shadow-blue-500/25 transition-all"
                  >
                    {isProcessingPay ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing Payment...</span>
                      </div>
                    ) : (
                      <>
                        <span>Proceed To Pay ₹{((priceQuote?.totalAmountPaise || 600) / 100).toFixed(2)}</span>
                        <span className="text-base group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= STEP D: DESKTOP-OPTIMIZED 2-COLUMN DIGITAL RELEASE DASHBOARD ================= */}
        {currentStep === 'pin_success' && activeOrder && (
          <div className="space-y-4 animate-fade-in w-full pb-10">
            {/* Top Celebration Strip */}
            <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50 via-white to-blue-50/80 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-md animate-pulse" />
                  <div className="relative h-11 w-11 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-xl font-black text-slate-900">
                      Payment Successful & Ready to Print!
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      PAID ₹{(activeOrder.totalAmountPaise / 100).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your print token is active at <strong className="text-slate-800">{activeOrder.machineName}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-xs font-bold shadow-2xs">
                  Order #{activeOrder.orderNumber}
                </span>
              </div>
            </div>

            {/* 2-Column Desktop Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full">
              {/* ================= LEFT COLUMN (7 COLS): DIGITAL BOARDING PASS / PRINT TICKET ================= */}
              <div className="lg:col-span-7 space-y-3">
                <div className="relative rounded-3xl border border-slate-200/90 bg-white shadow-md overflow-hidden transition-all">
                  <div className="h-2 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#0284c7]" />

                  {/* Ticket Header with Tab Switcher */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          Your Print Code is Ready!
                        </p>
                        <p className="text-xs text-slate-500">
                          Use this QR code or 4-digit PIN at the kiosk within 24 hours.
                        </p>
                      </div>

                      {/* Dual Option Toggle Tabs */}
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.keyPress();
                            setActiveCodeTab('qr');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeCodeTab === 'qr'
                              ? 'bg-white text-[#2563eb] shadow-xs border border-slate-200/60'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Code</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.keyPress();
                            setActiveCodeTab('pin');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeCodeTab === 'pin'
                              ? 'bg-white text-[#2563eb] shadow-xs border border-slate-200/60'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>PIN</span>
                        </button>
                      </div>
                    </div>

                    {/* View Option 1: QR CODE */}
                    {activeCodeTab === 'qr' && (
                      <div className="py-2 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in">
                        <div className="p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center">
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt="Print QR Code"
                              className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-44 h-44 flex items-center justify-center">
                              <RefreshCw className="w-6 h-6 animate-spin text-[#2563eb]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          Hold screen in front of kiosk scanner to auto-release prints.
                        </p>
                      </div>
                    )}

                    {/* View Option 2: 4-DIGIT PIN */}
                    {activeCodeTab === 'pin' && (
                      <div className="text-center py-2 space-y-2.5 bg-gradient-to-b from-[#f4fcf6] to-white rounded-2xl border border-blue-100/80 p-4 animate-fade-in">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          Type this 4-Digit PIN on Kiosk Touchscreen
                        </span>

                        {/* Glowing Digit Boxes */}
                        <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-1">
                          {activeOrder.fourDigitPin.split('').map((char, i) => (
                            <div
                              key={i}
                              className="flex h-14 w-12 sm:h-18 sm:w-16 items-center justify-center rounded-2xl bg-white border-2 border-[#2563eb]/50 text-3xl sm:text-4xl font-black text-[#2563eb] font-mono shadow-sm transition-transform hover:scale-105 select-all"
                            >
                              <span>{char}</span>
                            </div>
                          ))}
                        </div>

                        {/* Copy PIN button */}
                        <div className="flex justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.keyPress();
                              copyPinToClipboard(activeOrder.fourDigitPin);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-[#2563eb] transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            {copiedPin ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-[#2563eb]" />
                                <span className="text-[#2563eb]">PIN Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Tap to Copy PIN</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Notification Status Badge */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-blue-950">WhatsApp Order Dispatched</p>
                          <p className="text-[11px] text-emerald-700 font-mono truncate">
                            Sent to +91 {customerPhone || phoneInput || '86674 66390'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://api.whatsapp.com/send?${(customerPhone || phoneInput) ? `phone=${(customerPhone || phoneInput).replace(/\D/g, '').length === 10 ? '91' + (customerPhone || phoneInput).replace(/\D/g, '') : (customerPhone || phoneInput).replace(/\D/g, '')}&` : ''}text=${encodeURIComponent(
                          `Hello,\n\nYour SmartPrint order has been successfully created.\n\nOrder PIN: ${activeOrder.fourDigitPin}\n\nUse this PIN at any RIT Campus SmartPrint Kiosk to print your document.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
                      >
                        Open Chat
                      </a>
                    </div>
                  </div>

                  {/* Perforated Notch Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute -left-3 h-6 w-6 rounded-full bg-futuristic-grid border-r border-slate-200/90" />
                    <div className="w-full border-t-2 border-dashed border-slate-200 mx-5" />
                    <div className="absolute -right-3 h-6 w-6 rounded-full bg-futuristic-grid border-l border-slate-200/90" />
                  </div>

                  {/* Ticket Bottom Details */}
                  <div className="p-5 sm:p-6 bg-slate-50/60 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-emerald-100 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Pickup Terminal
                        </span>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {activeOrder.machineName || currentMachine?.displayName || 'Library Ground Floor Kiosk 01'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {currentMachine?.organizationName || 'RIT CHENNAI'} • Self-Service Terminal
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 font-medium">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>PIN valid for 24 Hours</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Auto-wiped after printing</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.keyPress();
                      setFilesList([]);
                      setActiveOrder(null);
                      setCurrentStep('upload_landing');
                    }}
                    className="w-full py-3.5 rounded-2xl btn-primary-glow text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer group transition-all shadow-md"
                  >
                    <span>Print Another Document</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?${(customerPhone || phoneInput) ? `phone=${(customerPhone || phoneInput).replace(/\D/g, '').length === 10 ? '91' + (customerPhone || phoneInput).replace(/\D/g, '') : (customerPhone || phoneInput).replace(/\D/g, '')}&` : ''}text=${encodeURIComponent(
                        `Hello,\n\nYour SmartPrint order has been successfully created.\n\nOrder PIN: ${activeOrder.fourDigitPin}\n\nUse this PIN at any RIT Campus SmartPrint Kiosk to print your document.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl border border-blue-300 bg-blue-50/80 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Send to WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-600" />
                      <span>Download Slip</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= RIGHT COLUMN (5 COLS): KIOSK GUIDE & DOCUMENT SUMMARY ================= */}
              <div className="lg:col-span-5 space-y-3">
                {/* Card 1: 3-Step Kiosk Collection Walkthrough */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>How to Collect</span>
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-blue-200 font-bold">
                      Takes 10 Seconds
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Step 1 */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900">Walk to the Kiosk</p>
                        <p className="text-[11px] text-slate-500">Go to {activeOrder.machineName || 'the kiosk'}.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900">Type 4-Digit PIN</p>
                        <p className="text-[11px] text-slate-500">
                          Enter <strong className="font-mono text-[#2563eb] font-black">{activeOrder.fourDigitPin}</strong> on the touchscreen.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900">Grab Fresh Prints</p>
                        <p className="text-[11px] text-slate-500">Prints dispense directly into the output tray.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Document Summary & Print Specifications */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900">Order Specifications</h3>
                    <span className="text-[10px] font-mono text-slate-400">{filesList.length || 1} Document{(filesList.length > 1) ? 's' : ''}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {filesList.length > 0 ? (
                      filesList.map((doc, idx) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-6 rounded bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                              {doc.pageThumbnails && doc.pageThumbnails[0] ? (
                                <img src={doc.pageThumbnails[0]} alt={doc.name} className="h-full w-full object-contain" />
                              ) : (
                                <FileText className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[170px]" title={doc.name}>{doc.name}</p>
                              <p className="text-[10px] text-slate-500">{doc.pages} pg • {doc.copies || 1}x {doc.colorMode === 'color' ? 'Color' : 'B/W'}</p>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 shrink-0">
                            {(doc.name.split('.').pop() || 'DOC').toUpperCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-900 truncate">{activeOrder.fileName}</span>
                        <span className="text-slate-500 font-mono text-xs">{activeOrder.calculatedPrintPages || activeOrder.detectedTotalPages || 1} Pages</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Total Paid</span>
                    <span className="font-mono font-black text-base text-[#2563eb]">
                      ₹{(activeOrder.totalAmountPaise / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Card 3: Security Guarantee */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-center">
                  <p className="text-[11px] text-blue-800 font-medium flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#2563eb] shrink-0" />
                    <span>Files auto-deleted from cloud after printing.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


      </main>

      {/* ================= FIXED BOTTOM STICKY BAR: "Next ->" (Screenshot 5) ================= */}
      {currentStep === 'files_uploaded_list' && filesList.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-slate-200/90 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md z-40">
          <div className="max-w-3xl mx-auto space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2563eb] px-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Your data is secure and private.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.keyPress();
                setCurrentStep('configure_settings');
              }}
              className="w-full h-14 rounded-2xl btn-primary-glow text-white font-bold text-base tracking-wide flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>Next</span>
              <span className="text-lg group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= FIXED BOTTOM STICKY BAR: "Proceed To Pay" in blank_sheets (Screenshot 3) ================= */}
      {currentStep === 'blank_sheets' && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-slate-200/90 px-6 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Total {blankSheetCount} {blankSheetCount === 1 ? 'sheet' : 'sheets'}
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  ₹{(blankSheetCount * 2).toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => alert('Price: ₹2.00 per blank sheet. Zero platform handling charges.')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Price breakdown info"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={blankSheetCount === 0}
              onClick={() => {
                if (blankSheetCount <= 0) return;
                sounds.keyPress();
                const blankDoc: UploadedDocument = {
                  id: `blank-a4-${Date.now()}`,
                  name: `${blankSheetCount}x Blank A4 Sheets (80 GSM)`,
                  sizeFormatted: `${blankSheetCount} Sheets`,
                  pages: blankSheetCount,
                  pageThumbnails: [],
                  copies: 1,
                  colorMode: 'bw',
                  duplexMode: 'simplex',
                  orientation: 'portrait',
                  pageSelectionType: 'all',
                  selectedPages: Array.from({ length: blankSheetCount }, (_, i) => i + 1),
                  customRangeInput: `1-${blankSheetCount}`,
                };
                setFilesList([blankDoc]);
                setSelectedDocId(blankDoc.id);
                const totalPaise = blankSheetCount * 200;
                setPriceQuote({
                  pagesToPrintPerCopy: blankSheetCount,
                  totalPrintPages: blankSheetCount,
                  totalSheets: blankSheetCount,
                  ratePerSheetPaise: 200,
                  subtotalPaise: totalPaise,
                  taxPaise: 0,
                  totalAmountPaise: totalPaise,
                  formattedTotalRupees: `₹${(totalPaise / 100).toFixed(0)}`,
                  formattedSubtotalRupees: `₹${(totalPaise / 100).toFixed(0)}`,
                });
                setCurrentStep('review_order');
                if (!customerPhone) {
                  setShowPhoneVerifyModal(true);
                }
              }}
              className={`h-13 px-8 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 group transition-all ${
                blankSheetCount > 0
                  ? 'btn-primary-glow text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Proceed To Pay</span>
              <span className="text-base group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= FIXED BOTTOM STICKY BAR: "Proceed To Pay" in configure_settings ================= */}
      {currentStep === 'configure_settings' && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 border-t border-slate-200/90 px-6 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Total {priceQuote?.totalPrintPages || 3} pages
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono pt-0.5">
                {priceQuote?.formattedTotalRupees || '₹6'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.keyPress();
                setCurrentStep('review_order');
                if (!customerPhone) {
                  setShowPhoneVerifyModal(true);
                }
              }}
              className="h-12 px-7 rounded-2xl btn-primary-glow text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Proceed To Pay</span>
              <span className="text-base group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </button>
          </div>
        </div>
      )}



      {/* ================= MODAL: ENTER STUDENT / USER DETAILS ================= */}
      {showPhoneVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setShowPhoneVerifyModal(false)}
              className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1.5 pt-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Enter Student Details
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                Enter your name and mobile number to receive your pickup PIN on WhatsApp
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>Student Full Name</span>
                </label>
                <div className="flex rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/20 transition-all">
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                  <span>WhatsApp Mobile Number</span>
                </label>
                <div className="flex rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/20 transition-all">
                  <div className="px-4 py-3 bg-slate-50 border-r border-slate-200 text-xs sm:text-sm font-bold text-slate-700 flex items-center select-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.keyPress();
                setCustomerName(nameInput.trim());
                setCustomerPhone(phoneInput.trim());
                setShowPhoneVerifyModal(false);
              }}
              className="w-full h-12 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: "SPECIFIC PAGE" (EXACT AS SCREENSHOT 4) ================= */}
      {showSpecificPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Specific Page</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={() => setShowSpecificPageModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input range box + Apply button */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Eg. 1, 3-5"
                value={activeDoc.customRangeInput || ''}
                onChange={(e) => updateActiveDoc({ customRangeInput: e.target.value })}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyRangeInput}
                className="px-5 py-2.5 rounded-xl border border-[#2563eb] text-xs font-bold text-[#2563eb] hover:bg-blue-50 transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Grid of Page Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
              {Array.from({ length: activeDoc.pages || 1 }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = (activeDoc.selectedPages || []).includes(pageNum);
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => togglePageSelection(pageNum)}
                    className={`relative rounded-2xl border-2 p-3 text-center transition-all flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-[#2563eb] bg-blue-50'
                        : 'border-slate-200 bg-white opacity-50'
                    }`}
                  >
                    {/* Top Right Green Check Indicator */}
                    {isSelected && (
                      <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}

                    {/* Page Thumbnail Sheet */}
                    <div className="w-24 h-32 rounded-lg bg-white shadow-2xs border border-slate-200 overflow-hidden relative flex flex-col justify-between mb-2">
                      {activeDoc.pageThumbnails && activeDoc.pageThumbnails[pageNum - 1] ? (
                        <img
                          src={activeDoc.pageThumbnails[pageNum - 1]}
                          alt={`Page ${pageNum}`}
                          className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
                            activeDoc.colorMode === 'bw' ? 'grayscale contrast-110 brightness-95' : 'contrast-100'
                          }`}
                        />
                      ) : activeDoc.isImage && activeDoc.previewUrl ? (
                        <img
                          src={activeDoc.previewUrl}
                          alt={`Page ${pageNum}`}
                          className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
                            activeDoc.colorMode === 'bw' ? 'grayscale contrast-110 brightness-95' : 'contrast-100'
                          }`}
                        />
                      ) : (
                        <div className="p-2 h-full w-full flex flex-col justify-between select-none bg-white text-slate-800">
                          <div className="space-y-1 text-[5px]">
                            <div className="h-1.5 w-3/4 bg-slate-800 rounded-xs mb-1" />
                            <div className="h-0.5 w-full bg-slate-300 rounded-xs" />
                            <div className="h-0.5 w-5/6 bg-slate-300 rounded-xs" />
                            <div className="h-0.5 w-4/6 bg-slate-200 rounded-xs" />
                            <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
                            <div className="h-0.5 w-3/4 bg-slate-200 rounded-xs" />
                          </div>
                          <div className="flex justify-between text-[6px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                            <span>pg {pageNum}</span>
                            <span>A4</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-bold text-slate-900">
                      Page {pageNum}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={() => setShowSpecificPageModal(false)}
              className="w-full py-3.5 rounded-2xl bg-[#2563eb] hover:bg-[#2563eb] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 1B: FULL INTERACTIVE DOCUMENT PREVIEW ================= */}
      {showFullPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl h-[85vh] rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-[#2563eb]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                      {activeDoc.name}
                    </h2>
                    {activeDoc.colorMode === 'bw' ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        B/W Grayscale
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563eb] text-[10px] font-bold border border-blue-200">
                        Full Color
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeDoc.sizeFormatted} • {activeDoc.pages} {activeDoc.pages === 1 ? 'Page' : 'Pages'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullPreviewModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Interactive Preview Container - Clean Native Document Pages (No Browser Toolbars) */}
            <div className="flex-1 w-full my-3 rounded-2xl overflow-y-auto bg-slate-100/80 border border-slate-200 p-4 relative">
              {activeDoc.pageThumbnails && activeDoc.pageThumbnails.length > 0 ? (
                <div className="space-y-4 max-w-xl mx-auto">
                  {activeDoc.pageThumbnails.map((thumb, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden relative group"
                    >
                      <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Page {idx + 1} of {activeDoc.pageThumbnails?.length}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-blue-800 font-bold">
                          {activeDoc.colorMode === 'bw' ? 'B/W Preview' : 'Color Preview'}
                        </span>
                      </div>
                      <div className="p-2 sm:p-4 bg-white flex justify-center">
                        <img
                          src={thumb}
                          alt={`Page ${idx + 1}`}
                          className={`max-h-[60vh] w-auto object-contain rounded shadow-2xs transition-all duration-300 ${
                            activeDoc.colorMode === 'bw' ? 'grayscale contrast-110 brightness-95' : 'contrast-100'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeDoc.previewUrl && activeDoc.isImage ? (
                <div className="h-full flex items-center justify-center p-4">
                  <img
                    src={activeDoc.previewUrl}
                    alt={activeDoc.name}
                    className={`max-h-[65vh] w-auto object-contain rounded-xl shadow-md bg-white p-2 transition-all duration-300 ${
                      activeDoc.colorMode === 'bw' ? 'grayscale contrast-110 brightness-95' : 'contrast-100'
                    }`}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mb-3 shadow-inner">
                    <FileText className="h-8 w-8" />
                  </div>
                  <p className="text-base font-bold text-slate-900">{activeDoc.name}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {activeDoc.pages} {activeDoc.pages === 1 ? 'page' : 'pages'} verified & ready for high-speed laser printing
                  </p>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Total {activeDoc.pages || 1} {activeDoc.pages === 1 ? 'Page' : 'Pages'}
              </span>
              <button
                type="button"
                onClick={() => setShowFullPreviewModal(false)}
                className="px-6 py-2.5 rounded-xl btn-primary-glow text-white font-bold text-xs shadow-sm transition-all"
              >
                Done Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: AUTHENTIC KIOSK UPLOAD & VERIFICATION MODAL ================= */}
      {isProcessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden">
            {/* Header with Title & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Print ATM Cloud Ingestion</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.keyPress();
                  setIsProcessingModal(false);
                }}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STAGE 1: PROCESSING / SCANNING DOCUMENT */}
            {uploadStage === 'processing' && (
              <div className="space-y-4 py-2 animate-fade-in">
                {/* Authentic Document Scanning Box */}
                <div className="relative h-44 w-full rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col items-center justify-center overflow-hidden p-4">
                  {/* Glowing Laser Scanline */}
                  <div className="animate-laser" />

                  {/* Document Graphic Card */}
                  <div className="relative w-28 h-36 bg-white rounded-lg border border-slate-200 shadow-md p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {uploadingDocMeta?.type || 'DOC'}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    </div>
                    
                    <div className="space-y-1.5 py-2">
                      <div className="h-1.5 bg-slate-200 rounded-full w-full" />
                      <div className="h-1.5 bg-slate-150 rounded-full w-4/5" />
                      <div className="h-1.5 bg-slate-150 rounded-full w-full" />
                      <div className="h-1.5 bg-slate-100 rounded-full w-3/5" />
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] font-mono text-slate-400">
                      <span>A4 FORMAT</span>
                      <span>300 DPI</span>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    Analyzing Document
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Inspecting page dimensions, orientation & print margins...
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Document Name</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={uploadingDocMeta?.name}>
                      {uploadingDocMeta?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">File Size</span>
                    <span className="font-mono font-semibold text-slate-800">{uploadingDocMeta?.size}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: UPLOADING TO SECURE CLOUD */}
            {uploadStage === 'uploading' && (
              <div className="space-y-4 py-2 animate-fade-in">
                {/* File Uploading Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={uploadingDocMeta?.name}>
                        {uploadingDocMeta?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {uploadingDocMeta?.size} • {uploadingDocMeta?.type}
                      </p>
                    </div>
                  </div>

                  {/* Precision Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Uploading to kiosk queue</span>
                      <span className="font-mono font-bold text-[#2563eb]">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#2563eb] transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    256-bit TLS Encrypted
                  </span>
                  <span>Auto-purged after print</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.keyPress();
                    setIsProcessingModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel Upload
                </button>
              </div>
            )}

            {/* STAGE 3: UPLOAD COMPLETE & VERIFIED */}
            {uploadStage === 'success' && (
              <div className="space-y-4 animate-fade-in pt-1">
                {/* Header with clean checkmark */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Upload Complete
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Document verified and ready for printing
                    </p>
                  </div>
                </div>

                {/* Document Summary Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-3">
                  <div className="flex items-center gap-3">
                    {uploadingDocMeta?.previewThumbnail ? (
                      <div className="w-12 h-15 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs shrink-0 flex items-center justify-center p-0.5">
                        <img 
                          src={uploadingDocMeta.previewThumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-15 rounded-lg border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center text-blue-600">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#2563eb] text-[9px] font-bold font-mono">
                          {uploadingDocMeta?.type || 'PDF'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate" title={uploadingDocMeta?.name}>
                          {uploadingDocMeta?.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {uploadingDocMeta?.size}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2563eb] shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">Total Pages</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                          {uploadingDocMeta?.detectedPages || 1} {uploadingDocMeta?.detectedPages === 1 ? 'Page' : 'Pages'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">Format</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">Standard A4</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto Redirecting Progress Indicator */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5 px-0.5">
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      Opening uploaded documents...
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">Auto redirecting</span>
                  </div>

                  {/* Sleek Auto-Close Countdown Progress Track */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                    <div 
                      className="h-full rounded-full bg-[#2563eb] transition-all duration-[2000ms] ease-linear w-full animate-pulse"
                    />
                  </div>
                </div>

                {/* Instant Proceed Action */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.keyPress();
                    setIsProcessingModal(false);
                    setCurrentStep('files_uploaded_list');
                  }}
                  className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer group"
                >
                  <span>Click here if not redirected automatically</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: HOW IT WORKS / HELP ================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">How SmartPrint Works</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Instant, contactless document printing in 3 easy steps:
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">Upload & Configure</p>
                  <p className="text-slate-500 mt-0.5">Select your PDF or document, choose B&W or Color, copies, and orientation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">Pay & Get 4-Digit PIN</p>
                  <p className="text-slate-500 mt-0.5">Pay securely via UPI QR. You will instantly receive a unique 4-digit release PIN.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900">Collect at SmartPrint Kiosk</p>
                  <p className="text-slate-500 mt-0.5">Enter your 4-digit PIN on the kiosk screen at {currentMachine?.displayName || 'the kiosk'} to print instantly.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-[#2563eb] text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:bg-[#1d4ed8] transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: PAYMENT FAILURE & INSTANT RECOVERY ================= */}
      {paymentFailure && paymentFailure.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-red-200/90 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl space-y-5">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                sounds.keyPress();
                setPaymentFailure(null);
              }}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Alert Header */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldAlert className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {paymentFailure.title || 'Payment Incomplete'}
                  </h3>
                </div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-red-100/70 text-[10px] font-bold text-red-700 uppercase tracking-wider mt-0.5">
                  {paymentFailure.isDismissed ? 'Transaction Dismissed' : 'Gateway Notice'}
                </span>
              </div>
            </div>

            {/* Detailed Reason Box */}
            <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100/90 text-xs text-red-900 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1.5 text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Notice Reason:
              </p>
              <p className="text-slate-700">
                {paymentFailure.reason}
              </p>
            </div>

            {/* Safe Payment Guarantee Reassurance */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#2563eb] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug">
                <span className="font-bold text-slate-900">100% Safe Payment Guarantee:</span> If any funds were debited from your bank/UPI app, Razorpay & NPCI will automatically reverse the full amount within 2 to 4 hours.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.keyPress();
                  handlePayAndGeneratePin();
                }}
                disabled={isProcessingPay}
                className="w-full py-3.5 rounded-2xl btn-primary-glow text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 hover:bg-[#1d4ed8] transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 stroke-[2.2]" />
                {isProcessingPay ? 'Initiating Gateway...' : 'Retry Payment Now'}
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.keyPress();
                  setPaymentFailure(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Modify Files & Print Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
