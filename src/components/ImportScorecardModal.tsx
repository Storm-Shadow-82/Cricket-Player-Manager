import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { recognize } from 'tesseract.js';
import { BatterScore, BowlerScore, MatchSummary, Player, CoachProfile } from '../types/cricket';
import { computeDynamicImpactScore, findMatchingSquadPlayer } from '../utils/cricket';

export interface ExtrasBreakdown {
  total: number;
  byes: number;
  legByes: number;
  wides: number;
  noBalls: number;
  penalty: number;
}

export interface DiagnosticLog {
  timestamp: string;
  fileInfo: { name: string; size: number; type: string };
  rawExtractedPdfText: string;
  geminiRawOutput?: string;
  parsedResultSummary: {
    team1: string;
    team1Score: string;
    team1BattersCount: number;
    team1BowlersCount: number;
    team2: string;
    team2Score: string;
    team2BattersCount: number;
    team2BowlersCount: number;
  };
  playerMatchDetails: Array<{
    extractedName: string;
    team: string;
    matchedPlayerName?: string;
    confidence: number;
    status: 'EXACT_MATCH' | 'FUZZY_MATCH' | 'UNLINKED';
  }>;
}

interface ImportScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playersPool: Player[];
  coachProfile?: CoachProfile;
  onImportScorecard: (importedData: {
    match: Partial<MatchSummary>;
    batters: BatterScore[];
    bowlers: BowlerScore[];
    fowList?: any[];
  }) => void;
  onAddPlayerToPool?: (newPlayer: Player) => void;
  onShowToast: (msg: string) => void;
}

// Check if string contains unprintable binary stream noise
const isBinaryGarbageText = (str: string): boolean => {
  if (!str || str.length === 0) return false;
  let nonPrintableCount = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code > 126) {
      nonPrintableCount++;
    }
  }
  return nonPrintableCount / str.length > 0.12;
};

// Extract XMP Metadata from PDF String
const extractPdfXmpMetadata = (rawPdfStr: string) => {
  const titleMatch = rawPdfStr.match(/<dc:title>[\s\S]*?<rdf:li[^>]*>(.*?)<\/rdf:li>/i);
  const descMatch = rawPdfStr.match(/<dc:description>[\s\S]*?<rdf:li[^>]*>(.*?)<\/rdf:li>/i);

  let team1Name = '';
  let team2Name = '';

  const rawTitle = titleMatch ? titleMatch[1] : descMatch ? descMatch[1] : '';
  if (rawTitle) {
    const cleaned = rawTitle.replace(/Scorecard of/i, '').replace(/match summary/i, '').trim();
    const parts = cleaned.split(/\s+(?:v\/s|vs|v|versus)\s+/i);
    if (parts.length >= 2) {
      team1Name = parts[0].trim();
      team2Name = parts[1].trim();
    }
  }

  return { team1Name, team2Name };
};

// Clean text extraction from PDF ArrayBuffer
const extractRawTextFromPdfArrayBuffer = (buffer: ArrayBuffer): { text: string; xmpTeams: { team1Name: string; team2Name: string } } => {
  try {
    const textDecoder = new TextDecoder('latin1');
    const rawStr = textDecoder.decode(buffer);
    const xmpTeams = extractPdfXmpMetadata(rawStr);

    const textChunks: string[] = [];

    // Match Tj string operators: (text) Tj
    const tjRegex = /\(([^()]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawStr)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        textChunks.push(match[1].trim());
      }
    }

    // Match TJ array operators: [(text) 20 (more)] TJ
    const tjArrayRegex = /\[\s*(.*?)\s*\]\s*TJ/gi;
    while ((match = tjArrayRegex.exec(rawStr)) !== null) {
      const inner = match[1];
      const strRegex = /\(([^()]+)\)/g;
      let m;
      let lineText = '';
      while ((m = strRegex.exec(inner)) !== null) {
        lineText += m[1];
      }
      if (lineText.trim().length > 0) {
        textChunks.push(lineText.trim());
      }
    }

    const extracted = textChunks.join('\n');
    if (isBinaryGarbageText(extracted)) {
      return { text: '', xmpTeams };
    }

    return { text: extracted, xmpTeams };
  } catch (e) {
    return { text: '', xmpTeams: { team1Name: '', team2Name: '' } };
  }
};

// Multi-Pattern Flexible Local Cricket Text Parser
const parseAnyCricketText = (rawText: string) => {
  let team1Name = 'Team 1';
  let team1Score = '0/0';
  let team1Overs = '0.0';
  let team1Extras: ExtrasBreakdown = { total: 0, byes: 0, legByes: 0, wides: 0, noBalls: 0, penalty: 0 };

  let team2Name = 'Team 2';
  let team2Score = '0/0';
  let team2Overs = '0.0';
  let team2Extras: ExtrasBreakdown = { total: 0, byes: 0, legByes: 0, wides: 0, noBalls: 0, penalty: 0 };

  let resultStr = '';

  const innings1Batters: BatterScore[] = [];
  const innings1Bowlers: BowlerScore[] = [];
  const innings2Batters: BatterScore[] = [];
  const innings2Bowlers: BowlerScore[] = [];

  const lines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

  // Parse Teams from Header
  const vsMatch = rawText.match(/([a-z0-9\s]{2,30})\s+(?:vs|v\/s|v|versus)\s+([a-z0-9\s]{2,30})/i);
  if (vsMatch) {
    team1Name = vsMatch[1].trim();
    team2Name = vsMatch[2].trim();
  }

  // Parse Scores: "159/6 (20.0 Ov)" or "159-6"
  const scoreMatches = Array.from(rawText.matchAll(/([a-z0-9\s]{2,25})?\s*(\d{1,3}\s*[\/\-]\s*\d{1,2})\s*(?:\(([\d\.]+)\s*ov\w*\))?/gi));
  if (scoreMatches.length >= 1) {
    if (scoreMatches[0][1]?.trim()) team1Name = scoreMatches[0][1].trim();
    team1Score = scoreMatches[0][2].replace(/\s+/g, '');
    if (scoreMatches[0][3]) team1Overs = scoreMatches[0][3];
  }
  if (scoreMatches.length >= 2) {
    if (scoreMatches[1][1]?.trim()) team2Name = scoreMatches[1][1].trim();
    team2Score = scoreMatches[1][2].replace(/\s+/g, '');
    if (scoreMatches[1][3]) team2Overs = scoreMatches[1][3];
  }

  // Parse Result
  const resMatch = rawText.match(/([a-z0-9\s]+won\s+by\s+[a-z0-9\s]+)/i);
  if (resMatch) {
    resultStr = resMatch[1].trim();
  }

  // Parse Lines
  let currentInnings: 1 | 2 = 1;
  let currentMode: 'batting' | 'bowling' | 'none' = 'none';

  lines.forEach((line) => {
    const lower = line.toLowerCase();

    if (lower.includes('2nd innings') || lower.includes('second innings') || (currentInnings === 1 && lower.includes('innings 2'))) {
      currentInnings = 2;
      currentMode = 'none';
      return;
    }

    if (lower.includes('batting') || lower.includes('batsman') || lower.includes('batter')) {
      currentMode = 'batting';
      return;
    }
    if (lower.includes('bowling') || lower.includes('bowler')) {
      currentMode = 'bowling';
      return;
    }

    // Pattern 1: Batter with Dismissal, Runs, Balls, 4s, 6s: e.g. "Monjurul c Smith b Jones 27 18 5 1"
    const bm1 = line.match(/^([a-z0-9\s\.\,\'\-\(\)]+?)\s+(c\s+.*?b\s+.*?|b\s+.*?|lbw\s+.*?|not\s+out|run\s+out|st\s+.*?|out)?\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,2})\s+(\d{1,2})/i);
    if (bm1) {
      const name = bm1[1].trim();
      const dismissal = bm1[2]?.trim() || 'out';
      const runs = Number(bm1[3]);
      const balls = Number(bm1[4]);
      const fours = Number(bm1[5]);
      const sixes = Number(bm1[6]);

      if (name && !name.toLowerCase().includes('total') && !name.toLowerCase().includes('extras') && !name.toLowerCase().includes('batter')) {
        const item: BatterScore = {
          id: `imp-b-${currentInnings}-${Date.now()}-${Math.random()}`,
          number: (currentInnings === 1 ? innings1Batters : innings2Batters).length + 1,
          name,
          hand: 'RHB',
          dismissal: dismissal || 'Out',
          isNotOut: dismissal.toLowerCase().includes('not out'),
          runs,
          balls,
          fours,
          sixes,
          sr: balls > 0 ? Number(((runs / balls) * 100).toFixed(1)) : 0,
          boundaryPct: 0,
          dotPct: 0,
        };

        if (currentInnings === 1) innings1Batters.push(item);
        else innings2Batters.push(item);
        return;
      }
    }

    // Pattern 2: Short Batter: e.g. "Monjurul 27 (18)"
    const bm2 = line.match(/^([a-z0-9\s\.\,\'\-\(\)]+?)\s+(\d{1,3})\s*\(\s*(\d{1,3})\s*\)/i);
    if (bm2) {
      const name = bm2[1].trim();
      const runs = Number(bm2[2]);
      const balls = Number(bm2[3]);

      if (name && !name.toLowerCase().includes('total')) {
        const item: BatterScore = {
          id: `imp-b-${currentInnings}-${Date.now()}-${Math.random()}`,
          number: (currentInnings === 1 ? innings1Batters : innings2Batters).length + 1,
          name,
          hand: 'RHB',
          dismissal: 'Out',
          isNotOut: false,
          runs,
          balls,
          fours: 0,
          sixes: 0,
          sr: balls > 0 ? Number(((runs / balls) * 100).toFixed(1)) : 0,
          boundaryPct: 0,
          dotPct: 0,
        };

        if (currentInnings === 1) innings1Batters.push(item);
        else innings2Batters.push(item);
        return;
      }
    }

    // Pattern 3: Bowler: e.g. "RJ 33 4.0 0 33 3"
    const bwm1 = line.match(/^([a-z0-9\s\.\,\'\-\(\)]+?)\s+([\d\.]+)\s+(\d{1,2})\s+(\d{1,3})\s+(\d{1,2})/i);
    if (bwm1) {
      const name = bwm1[1].trim();
      const overs = Number(bwm1[2]);
      const maidens = Number(bwm1[3]);
      const runs = Number(bwm1[4]);
      const wickets = Number(bwm1[5]);

      if (name && overs > 0 && !name.toLowerCase().includes('total')) {
        const item: BowlerScore = {
          id: `imp-bw-${currentInnings}-${Date.now()}-${Math.random()}`,
          name,
          style: 'Right-arm Medium',
          overs,
          maidens,
          runs,
          wickets,
          economy: overs > 0 ? Number((runs / overs).toFixed(2)) : 0,
          dots: 0,
          quotaMax: 5.0,
          state: 'Available',
          colorTag: '#4edea3',
        };

        if (currentInnings === 1) innings1Bowlers.push(item);
        else innings2Bowlers.push(item);
        return;
      }
    }

    // Pattern 4: Bowler with hyphens: e.g. "RJ 33 4-0-33-3"
    const bwm2 = line.match(/^([a-z0-9\s\.\,\'\-\(\)]+?)\s+(\d{1,2})\s*[\-]\s*(\d{1,2})\s*[\-]\s*(\d{1,3})\s*[\-]\s*(\d{1,2})/i);
    if (bwm2) {
      const name = bwm2[1].trim();
      const overs = Number(bwm2[2]);
      const maidens = Number(bwm2[3]);
      const runs = Number(bwm2[4]);
      const wickets = Number(bwm2[5]);

      if (name && overs > 0) {
        const item: BowlerScore = {
          id: `imp-bw-${currentInnings}-${Date.now()}-${Math.random()}`,
          name,
          style: 'Right-arm Medium',
          overs,
          maidens,
          runs,
          wickets,
          economy: overs > 0 ? Number((runs / overs).toFixed(2)) : 0,
          dots: 0,
          quotaMax: 5.0,
          state: 'Available',
          colorTag: '#4edea3',
        };

        if (currentInnings === 1) innings1Bowlers.push(item);
        else innings2Bowlers.push(item);
        return;
      }
    }
  });

  return {
    team1Name,
    team1Score,
    team1Overs,
    team1Extras,
    team2Name,
    team2Score,
    team2Overs,
    team2Extras,
    resultStr,
    innings1Batters,
    innings1Bowlers,
    innings2Batters,
    innings2Bowlers,
  };
};

export const ImportScorecardModal: React.FC<ImportScorecardModalProps> = ({
  isOpen,
  onClose,
  playersPool,
  coachProfile,
  onImportScorecard,
  onAddPlayerToPool,
  onShowToast,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Input channel states
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [activeInputTab, setActiveInputTab] = useState<'file' | 'text' | 'builder'>('file');

  // Parsed Scorecard State
  const [matchData, setMatchData] = useState<Partial<MatchSummary>>({
    team1: 'Team 1',
    team1Score: '0/0',
    team1Overs: '0.0',
    team2: 'Team 2',
    team2Score: '0/0',
    team2Overs: '0.0',
    result: '',
    toss: '',
    category: 'Practice',
    venue: 'Main Ground',
  });

  const [team1Extras, setTeam1Extras] = useState<ExtrasBreakdown>({ total: 0, byes: 0, legByes: 0, wides: 0, noBalls: 0, penalty: 0 });
  const [team2Extras, setTeam2Extras] = useState<ExtrasBreakdown>({ total: 0, byes: 0, legByes: 0, wides: 0, noBalls: 0, penalty: 0 });

  const [innings1Batters, setInnings1Batters] = useState<BatterScore[]>([]);
  const [innings1Bowlers, setInnings1Bowlers] = useState<BowlerScore[]>([]);
  const [innings2Batters, setInnings2Batters] = useState<BatterScore[]>([]);
  const [innings2Bowlers, setInnings2Bowlers] = useState<BowlerScore[]>([]);

  // Step 2 Settings
  const [ourTeamChoice, setOurTeamChoice] = useState<'team1' | 'team2'>('team1');
  const [anonymizeOpponent, setAnonymizeOpponent] = useState<boolean>(true);

  // Step 3 View Selectors
  const [selectedInningsView, setSelectedInningsView] = useState<'team1' | 'team2'>('team1');
  const [rawReviewTab, setRawReviewTab] = useState<'batters' | 'bowlers' | 'extras'>('batters');

  // Step 4 Name Associations
  const [nameAssociation, setNameAssociation] = useState<Record<string, string>>({});

  // Extraction Diagnostics & OCR State
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [diagnosticLog, setDiagnosticLog] = useState<DiagnosticLog | null>(null);
  const [showDiagnosticDrawer, setShowDiagnosticDrawer] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setPastedText('');
    setFile(null);
    setDiagnosticLog(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Open Fast Scorecard Builder with default empty rows
  const handleStartFastBuilder = () => {
    setMatchData({
      team1: coachProfile?.team || 'Titans CC',
      team1Score: '165/5',
      team1Overs: '20.0',
      team2: 'Opponent XI',
      team2Score: '142/9',
      team2Overs: '20.0',
      result: `${coachProfile?.team || 'Titans CC'} won by 23 runs.`,
      toss: `${coachProfile?.team || 'Titans CC'} won toss & elected to bat`,
      category: 'Practice',
      venue: 'National Cricket Ground',
    });

    setInnings1Batters([
      { id: 'b-1', number: 1, name: 'Opener 1', hand: 'RHB', dismissal: 'c & b Bowler 1', isNotOut: false, runs: 45, balls: 32, fours: 5, sixes: 2, sr: 140.6, boundaryPct: 0, dotPct: 0 },
      { id: 'b-2', number: 2, name: 'Opener 2', hand: 'LHB', dismissal: 'b Bowler 2', isNotOut: false, runs: 28, balls: 20, fours: 3, sixes: 1, sr: 140.0, boundaryPct: 0, dotPct: 0 },
      { id: 'b-3', number: 3, name: 'Batter 3', hand: 'RHB', dismissal: 'Not Out', isNotOut: true, runs: 62, balls: 41, fours: 7, sixes: 3, sr: 151.2, boundaryPct: 0, dotPct: 0 },
    ]);

    setInnings1Bowlers([
      { id: 'bw-1', name: 'Opponent Bowler 1', style: 'Right-arm Fast', overs: 4.0, maidens: 0, runs: 32, wickets: 2, economy: 8.0, dots: 0, quotaMax: 5.0, state: 'Available', colorTag: '#4edea3' },
      { id: 'bw-2', name: 'Opponent Bowler 2', style: 'Left-arm Spin', overs: 4.0, maidens: 0, runs: 28, wickets: 1, economy: 7.0, dots: 0, quotaMax: 5.0, state: 'Available', colorTag: '#4edea3' },
    ]);

    setInnings2Batters([
      { id: 'b-21', number: 1, name: 'Opponent Batter 1', hand: 'RHB', dismissal: 'c Keeper b Bowler 1', isNotOut: false, runs: 35, balls: 24, fours: 4, sixes: 1, sr: 145.8, boundaryPct: 0, dotPct: 0 },
      { id: 'b-22', number: 2, name: 'Opponent Batter 2', hand: 'RHB', dismissal: 'lbw b Bowler 2', isNotOut: false, runs: 18, balls: 15, fours: 2, sixes: 0, sr: 120.0, boundaryPct: 0, dotPct: 0 },
    ]);

    setInnings2Bowlers([
      { id: 'bw-21', name: 'Bowler 1', style: 'Right-arm Fast', overs: 4.0, maidens: 0, runs: 24, wickets: 3, economy: 6.0, dots: 0, quotaMax: 5.0, state: 'Available', colorTag: '#4edea3' },
      { id: 'bw-22', name: 'Bowler 2', style: 'Right-arm Spin', overs: 4.0, maidens: 0, runs: 30, wickets: 2, economy: 7.5, dots: 0, quotaMax: 5.0, state: 'Available', colorTag: '#4edea3' },
    ]);

    setStep(2);
    onShowToast('Opened Fast Scorecard Builder!');
  };

  // Add Row Helpers
  const handleAddBatterRow = () => {
    const isT1 = selectedInningsView === 'team1';
    const list = isT1 ? innings1Batters : innings2Batters;
    const newItem: BatterScore = {
      id: `b-new-${Date.now()}`,
      number: list.length + 1,
      name: `Batter #${list.length + 1}`,
      hand: 'RHB',
      dismissal: 'Out',
      isNotOut: false,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      sr: 0,
      boundaryPct: 0,
      dotPct: 0,
    };
    if (isT1) setInnings1Batters([...innings1Batters, newItem]);
    else setInnings2Batters([...innings2Batters, newItem]);
  };

  const handleAddBowlerRow = () => {
    const isT1 = selectedInningsView === 'team1';
    const list = isT1 ? innings1Bowlers : innings2Bowlers;
    const newItem: BowlerScore = {
      id: `bw-new-${Date.now()}`,
      name: `Bowler #${list.length + 1}`,
      style: 'Right-arm Medium',
      overs: 1.0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      dots: 0,
      quotaMax: 5.0,
      state: 'Available',
      colorTag: '#4edea3',
    };
    if (isT1) setInnings1Bowlers([...innings1Bowlers, newItem]);
    else setInnings2Bowlers([...innings2Bowlers, newItem]);
  };

  // Main Analyze & Extraction Trigger
  const handleAnalyzeAndExtract = async () => {
    if (!pastedText.trim() && !file) {
      onShowToast('Please upload a PDF/Image file or paste raw scorecard text first.');
      return;
    }

    setIsParsing(true);
    try {
      let contentToParse = pastedText.trim();
      let fileBase64 = '';
      let isBinaryFile = false;

      let extractedXmpTeams = { team1Name: '', team2Name: '' };

      if (file) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.type.startsWith('image/')) {
          isBinaryFile = true;
          const arrayBuffer = await file.arrayBuffer();
          const pdfExtract = extractRawTextFromPdfArrayBuffer(arrayBuffer);
          extractedXmpTeams = pdfExtract.xmpTeams;

          if (pdfExtract.text) {
            contentToParse += '\n' + pdfExtract.text;
          }

          fileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const b64 = res.split(',')[1] || res;
              resolve(b64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Perform Tesseract.js Visual Layout Analysis
          try {
            setOcrStatus('Analyzing document visual layout with Tesseract.js OCR...');
            const tesseractRes = await recognize(file, 'eng', {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  setOcrStatus(`Tesseract.js Visual OCR: ${Math.round((m.progress || 0) * 100)}%`);
                }
              },
            });

            if (tesseractRes?.data?.text && tesseractRes.data.text.trim().length > 10) {
              contentToParse += '\n' + tesseractRes.data.text.trim();
            }
          } catch (ocrErr) {
            // Fallback gracefully if worker fails in iframe
          } finally {
            setOcrStatus('');
          }
        } else {
          const textContent = await file.text();
          contentToParse += '\n' + textContent;
        }
      }

      let parsedResult = parseAnyCricketText(contentToParse);
      if (extractedXmpTeams.team1Name) parsedResult.team1Name = extractedXmpTeams.team1Name;
      if (extractedXmpTeams.team2Name) parsedResult.team2Name = extractedXmpTeams.team2Name;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.VITE_GEMINI_API_KEY;
      let rawAiOutput = '';

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `
You are an expert Cricket Match Report PDF & Image OCR Extraction Engine.
Examine this Cricket Match Report document (CricHeroes / CricHQ / TCPDF match report format) and extract ALL available statistics into valid JSON.

RULES:
1. HEADER: Extract "team1" name, "team2" name, "team1Score" (e.g. "159/6"), "team1Overs" ("20.0"), "team2Score" ("122/8"), "team2Overs" ("20.0"), "result" string, "toss" string, "venue", "category".
2. BATTING TABLES (Innings 1 & 2): Extract EVERY batter listed with "name", "runs", "balls", "fours", "sixes", "dismissal" (e.g. "c Smith b Jones", "not out"), "isNotOut" (boolean).
3. BOWLING TABLES (Innings 1 & 2): Extract EVERY bowler listed with "name", "overs", "maidens", "runs", "wickets", "style".
4. EXTRAS: Extract "byes", "legByes", "wides", "noBalls", "penalty".

${contentToParse ? 'Text Context:\n' + contentToParse : ''}

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "team1": "Team 1 Name",
  "team1Score": "1st Innings Score",
  "team1Overs": "20.0",
  "team1Extras": { "total": 0, "byes": 0, "legByes": 0, "wides": 0, "noBalls": 0, "penalty": 0 },
  "team2": "Team 2 Name",
  "team2Score": "2nd Innings Score",
  "team2Overs": "20.0",
  "team2Extras": { "total": 0, "byes": 0, "legByes": 0, "wides": 0, "noBalls": 0, "penalty": 0 },
  "result": "Official Result",
  "toss": "Toss details",
  "venue": "Venue",
  "category": "Tournament Category",
  "innings1": {
    "batters": [
      { "name": "Batter Name", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "dismissal": "Out method", "isNotOut": false }
    ],
    "bowlers": [
      { "name": "Bowler Name", "style": "Bowling Style", "overs": 0.0, "maidens": 0, "runs": 0, "wickets": 0 }
    ]
  },
  "innings2": {
    "batters": [
      { "name": "Batter Name", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "dismissal": "Out method", "isNotOut": false }
    ],
    "bowlers": [
      { "name": "Bowler Name", "style": "Bowling Style", "overs": 0.0, "maidens": 0, "runs": 0, "wickets": 0 }
    ]
  }
}
`;
          const contentsPayload: any[] = [];
          if (isBinaryFile && fileBase64) {
            contentsPayload.push({
              inlineData: {
                mimeType: file?.type.startsWith('image/') ? file.type : 'application/pdf',
                data: fileBase64,
              },
            });
          }
          contentsPayload.push(prompt);

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contentsPayload,
          });

          rawAiOutput = response.text?.trim() || '';
          const cleanJson = rawAiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedAi = JSON.parse(cleanJson);

          if (parsedAi.innings1?.batters?.length > 0 || parsedAi.innings2?.batters?.length > 0) {
            parsedResult = {
              team1Name: parsedAi.team1 || parsedResult.team1Name,
              team1Score: parsedAi.team1Score || parsedResult.team1Score,
              team1Overs: parsedAi.team1Overs || parsedResult.team1Overs,
              team1Extras: parsedAi.team1Extras || parsedResult.team1Extras,
              team2Name: parsedAi.team2 || parsedResult.team2Name,
              team2Score: parsedAi.team2Score || parsedResult.team2Score,
              team2Overs: parsedAi.team2Overs || parsedResult.team2Overs,
              team2Extras: parsedAi.team2Extras || parsedResult.team2Extras,
              resultStr: parsedAi.result || parsedResult.resultStr,
              innings1Batters: (parsedAi.innings1?.batters || []).map((b: any, i: number) => ({
                id: `imp-b-t1-${i + 1}`,
                number: i + 1,
                name: b.name || `Batter #${i + 1}`,
                hand: 'RHB',
                dismissal: b.dismissal || (b.isNotOut ? 'Not Out' : 'Out'),
                isNotOut: Boolean(b.isNotOut),
                runs: Number(b.runs) || 0,
                balls: Number(b.balls) || 0,
                fours: Number(b.fours) || 0,
                sixes: Number(b.sixes) || 0,
                sr: b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(1)) : 0,
                boundaryPct: 0,
                dotPct: 0,
              })),
              innings1Bowlers: (parsedAi.innings1?.bowlers || []).map((bw: any, i: number) => ({
                id: `imp-bw-t1-${i + 1}`,
                name: bw.name || `Bowler #${i + 1}`,
                style: bw.style || 'Right-arm Medium',
                overs: Number(bw.overs) || 0,
                maidens: Number(bw.maidens) || 0,
                runs: Number(bw.runs) || 0,
                wickets: Number(bw.wickets) || 0,
                economy: bw.overs > 0 ? Number((bw.runs / bw.overs).toFixed(2)) : 0,
                dots: 0,
                quotaMax: 5.0,
                state: 'Available',
                colorTag: '#4edea3',
              })),
              innings2Batters: (parsedAi.innings2?.batters || []).map((b: any, i: number) => ({
                id: `imp-b-t2-${i + 1}`,
                number: i + 1,
                name: b.name || `Batter #${i + 1}`,
                hand: 'RHB',
                dismissal: b.dismissal || (b.isNotOut ? 'Not Out' : 'Out'),
                isNotOut: Boolean(b.isNotOut),
                runs: Number(b.runs) || 0,
                balls: Number(b.balls) || 0,
                fours: Number(b.fours) || 0,
                sixes: Number(b.sixes) || 0,
                sr: b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(1)) : 0,
                boundaryPct: 0,
                dotPct: 0,
              })),
              innings2Bowlers: (parsedAi.innings2?.bowlers || []).map((bw: any, i: number) => ({
                id: `imp-bw-t2-${i + 1}`,
                name: bw.name || `Bowler #${i + 1}`,
                style: bw.style || 'Right-arm Medium',
                overs: Number(bw.overs) || 0,
                maidens: Number(bw.maidens) || 0,
                runs: Number(bw.runs) || 0,
                wickets: Number(bw.wickets) || 0,
                economy: bw.overs > 0 ? Number((bw.runs / bw.overs).toFixed(2)) : 0,
                dots: 0,
                quotaMax: 5.0,
                state: 'Available',
                colorTag: '#4edea3',
              })),
            };
          }
        } catch (e) {
          // Fallback to client parser
        }
      }

      setMatchData({
        team1: parsedResult.team1Name,
        team1Score: parsedResult.team1Score,
        team1Overs: parsedResult.team1Overs,
        team2: parsedResult.team2Name,
        team2Score: parsedResult.team2Score,
        team2Overs: parsedResult.team2Overs,
        result: parsedResult.resultStr,
        toss: '',
        category: 'Practice',
        venue: 'Main Cricket Stadium',
      });

      setTeam1Extras(parsedResult.team1Extras);
      setTeam2Extras(parsedResult.team2Extras);

      setInnings1Batters(parsedResult.innings1Batters);
      setInnings1Bowlers(parsedResult.innings1Bowlers);
      setInnings2Batters(parsedResult.innings2Batters);
      setInnings2Bowlers(parsedResult.innings2Bowlers);

      // Smart Auto-Detect Which Team Is Our Team based on actual squad player matches
      let t1Matches = 0;
      let t2Matches = 0;

      parsedResult.innings1Batters.forEach((b) => {
        if (findMatchingSquadPlayer(b.name, playersPool)) t1Matches++;
      });
      parsedResult.innings1Bowlers.forEach((bw) => {
        if (findMatchingSquadPlayer(bw.name, playersPool)) t1Matches++;
      });

      parsedResult.innings2Batters.forEach((b) => {
        if (findMatchingSquadPlayer(b.name, playersPool)) t2Matches++;
      });
      parsedResult.innings2Bowlers.forEach((bw) => {
        if (findMatchingSquadPlayer(bw.name, playersPool)) t2Matches++;
      });

      const coachTeamName = coachProfile?.team?.toLowerCase().trim();
      if (t2Matches > t1Matches) {
        setOurTeamChoice('team2');
      } else if (t1Matches > t2Matches) {
        setOurTeamChoice('team1');
      } else if (coachTeamName && parsedResult.team2Name.toLowerCase().includes(coachTeamName)) {
        setOurTeamChoice('team2');
      } else {
        setOurTeamChoice('team1');
      }

      // Generate Diagnostic Log
      const playerMatchDetails: Array<{
        extractedName: string;
        team: string;
        matchedPlayerName?: string;
        confidence: number;
        status: 'EXACT_MATCH' | 'FUZZY_MATCH' | 'UNLINKED';
      }> = [];

      const processDiagPlayer = (extractedName: string, teamLabel: string) => {
        const matchRes = findMatchingSquadPlayer(extractedName, playersPool);
        if (matchRes) {
          playerMatchDetails.push({
            extractedName,
            team: teamLabel,
            matchedPlayerName: matchRes.player.name,
            confidence: matchRes.confidence,
            status: matchRes.confidence >= 0.95 ? 'EXACT_MATCH' : 'FUZZY_MATCH',
          });
        } else {
          playerMatchDetails.push({
            extractedName,
            team: teamLabel,
            confidence: 0,
            status: 'UNLINKED',
          });
        }
      };

      parsedResult.innings1Batters.forEach((b) => processDiagPlayer(b.name, parsedResult.team1Name));
      parsedResult.innings2Batters.forEach((b) => processDiagPlayer(b.name, parsedResult.team2Name));

      const diagReport: DiagnosticLog = {
        timestamp: new Date().toISOString(),
        fileInfo: {
          name: file?.name || 'Pasted Raw Scorecard Text',
          size: file?.size || pastedText.length,
          type: file?.type || 'text/plain',
        },
        rawExtractedPdfText: contentToParse,
        geminiRawOutput: rawAiOutput || undefined,
        parsedResultSummary: {
          team1: parsedResult.team1Name,
          team1Score: parsedResult.team1Score,
          team1BattersCount: parsedResult.innings1Batters.length,
          team1BowlersCount: parsedResult.innings1Bowlers.length,
          team2: parsedResult.team2Name,
          team2Score: parsedResult.team2Score,
          team2BattersCount: parsedResult.innings2Batters.length,
          team2BowlersCount: parsedResult.innings2Bowlers.length,
        },
        playerMatchDetails,
      };

      setDiagnosticLog(diagReport);

      // Print Diagnostic Table to Developer Console
      console.group('🔍 CRICKET PDF EXTRACTION & PLAYER MATCHING DIAGNOSTIC REPORT');
      console.log('Timestamp:', diagReport.timestamp);
      console.log('File Info:', diagReport.fileInfo);
      console.log('RAW PDF Extracted Text Stream:\n', diagReport.rawExtractedPdfText);
      if (diagReport.geminiRawOutput) {
        console.log('RAW Gemini AI Response Output:\n', diagReport.geminiRawOutput);
      }
      console.log('Parsed Summary:', diagReport.parsedResultSummary);
      console.table(diagReport.playerMatchDetails);
      console.groupEnd();

      setStep(2);
      onShowToast(`Successfully processed scorecard!`);
    } catch (err) {
      setStep(2);
      onShowToast('Parsed scorecard text with fallback parser.');
    } finally {
      setIsParsing(false);
    }
  };

  // Step 4 Linking Triggers
  const handleAutoLinkSquad = () => {
    let matchedCount = 0;
    const newAssoc = { ...nameAssociation };
    const ourBatters = ourTeamChoice === 'team1' ? innings1Batters : innings2Batters;

    ourBatters.forEach((b) => {
      const matchRes = findMatchingSquadPlayer(b.name, playersPool);
      if (matchRes) {
        newAssoc[b.id] = matchRes.player.id;
        matchedCount++;
      }
    });

    setNameAssociation(newAssoc);
    onShowToast(`Auto-matched ${matchedCount} player names to squad pool roster!`);
  };

  const handleBatchRegisterUnlinked = () => {
    let addedCount = 0;
    const newAssoc = { ...nameAssociation };
    const ourBatters = ourTeamChoice === 'team1' ? innings1Batters : innings2Batters;

    ourBatters.forEach((b) => {
      const currentAssoc = newAssoc[b.id];
      if (!currentAssoc || currentAssoc === 'unlinked') {
        const newPlayer: Player = {
          id: `p-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
          name: b.name,
          role: 'BATTER',
          hand: 'RHB',
          jerseyNum: Math.floor(Math.random() * 90) + 10,
          photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
          status: 'active',
          isOverseas: false,
          impactScore: computeDynamicImpactScore({
            matches: 1,
            runs: b.runs || 0,
            avg: b.runs || 0,
            sr: b.sr || 0,
            fifties: (b.runs || 0) >= 50 && (b.runs || 0) < 100 ? 1 : 0,
            hundreds: (b.runs || 0) >= 100 ? 1 : 0,
          }),
          matches: 1,
          runs: b.runs || 0,
          highScore: String(b.runs || 0),
          avg: b.runs || 0,
          sr: b.sr || 0,
          fifties: (b.runs || 0) >= 50 && (b.runs || 0) < 100 ? 1 : 0,
          hundreds: (b.runs || 0) >= 100 ? 1 : 0,
          overs: 0,
          wickets: 0,
          bbi: '0/0',
          econ: 0,
          catches: 0,
          stumpings: 0,
          recentForm: 'Imported PDF Player',
          country: 'Local Squad',
          powerplaySr: 120,
          middleSr: 110,
          deathSr: 140,
          drySpinAvg: 25,
          drySpinSr: 115,
          greenPaceAvg: 22,
          greenPaceSr: 110,
          flatBatAvg: 30,
          flatBatSr: 135,
        };

        if (onAddPlayerToPool) {
          onAddPlayerToPool(newPlayer);
        }
        newAssoc[b.id] = newPlayer.id;
        addedCount++;
      }
    });

    setNameAssociation(newAssoc);
    onShowToast(`Batch registered ${addedCount} unlinked PDF players to team squad pool!`);
  };

  const handleAcceptAndApply = () => {
    const activeBatters = ourTeamChoice === 'team1' ? innings1Batters : innings2Batters;
    const activeBowlers = ourTeamChoice === 'team1' ? innings2Bowlers : innings1Bowlers;

    const mappedBatters: BatterScore[] = activeBatters.map((b) => {
      const assocId = nameAssociation[b.id];
      const matchedSquad = playersPool.find((p) => p.id === assocId);
      return {
        ...b,
        name: matchedSquad ? matchedSquad.name : b.name,
      };
    });

    const finalMatch: Partial<MatchSummary> = {
      id: `M-PDF-${Date.now().toString().slice(-4)}`,
      team1: matchData.team1 || 'Team 1',
      team1Score: matchData.team1Score || '0/0',
      team1Overs: matchData.team1Overs || '0.0',
      team2: anonymizeOpponent ? 'Opponent XI' : matchData.team2 || 'Team 2',
      team2Score: matchData.team2Score || '0/0',
      team2Overs: matchData.team2Overs || '0.0',
      result: matchData.result || 'Match Completed',
      toss: matchData.toss || 'Toss Completed',
      date: new Date().toISOString().split('T')[0],
      venue: matchData.venue || 'Main Ground',
      category: matchData.category || 'Practice',
      round: 'PDF Import Record',
    };

    onImportScorecard({
      match: finalMatch,
      batters: mappedBatters,
      bowlers: activeBowlers,
    });

    onShowToast(`Successfully synced match record to squad pool and Dossiers!`);
    handleResetAndClose();
  };

  const activeOurBatters = ourTeamChoice === 'team1' ? innings1Batters : innings2Batters;
  const unlinkedCount = activeOurBatters.filter((b) => !nameAssociation[b.id] || nameAssociation[b.id] === 'unlinked').length;

  const currentViewBatters = selectedInningsView === 'team1' ? innings1Batters : innings2Batters;
  const currentViewBowlers = selectedInningsView === 'team1' ? innings1Bowlers : innings2Bowlers;
  const currentViewExtras = selectedInningsView === 'team1' ? team1Extras : team2Extras;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#151b2b] border border-[#2f3445] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-[#dde2f8] my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4edea3]/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3]">
              <span className="material-symbols-outlined text-[22px]">description</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#dde2f8]">PDF & Scorecard Universal Importer</h3>
              <p className="text-xs text-[#bbcabf]">
                Step {step} of 4: {
                  step === 1 ? 'Select Input Channel (PDF / Text / Fast Builder)' :
                  step === 2 ? 'Team Alignment & Anonymization' :
                  step === 3 ? 'Review Extracted Innings Figures' :
                  'Squad Link Workbench & Final Sync'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {diagnosticLog && (
              <button
                type="button"
                onClick={() => setShowDiagnosticDrawer(true)}
                className="px-2.5 py-1 rounded bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold text-xs border border-[#3198dc]/40 flex items-center gap-1 shadow"
              >
                <span className="material-symbols-outlined text-[16px]">bug_report</span>
                <span>Diagnostic Logs</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetAndClose}
              className="text-[#bbcabf] hover:text-[#dde2f8] p-1.5 rounded hover:bg-[#242a3a]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
          <div className={`p-2 rounded-lg border text-center font-bold ${
            step === 1 ? 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3]' : 'bg-[#080e1d] text-[#bbcabf] border-[#2f3445]'
          }`}>
            <span>1. Upload / Source</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-bold ${
            step === 2 ? 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3]' : 'bg-[#080e1d] text-[#bbcabf] border-[#2f3445]'
          }`}>
            <span>2. Team & Anonymize</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-bold ${
            step === 3 ? 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3]' : 'bg-[#080e1d] text-[#bbcabf] border-[#2f3445]'
          }`}>
            <span>3. Review Figures</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-bold ${
            step === 4 ? 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3]' : 'bg-[#080e1d] text-[#bbcabf] border-[#2f3445]'
          }`}>
            <span>4. Squad Sync</span>
          </div>
        </div>

        {/* STEP 1: CHOOSE INPUT CHANNEL */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 p-1 bg-[#080e1d] rounded-lg border border-[#2f3445] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveInputTab('file')}
                className={`flex-1 py-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeInputTab === 'file' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#bbcabf] hover:text-[#dde2f8]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Upload PDF / Image File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInputTab('text')}
                className={`flex-1 py-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeInputTab === 'text' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#bbcabf] hover:text-[#dde2f8]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">content_paste</span>
                <span>Paste Raw Text / Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInputTab('builder')}
                className={`flex-1 py-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeInputTab === 'builder' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#bbcabf] hover:text-[#dde2f8]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Fast Scorecard Builder</span>
              </button>
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {activeInputTab === 'file' && (
              <div className="flex flex-col gap-3">
                <div className="border-2 border-dashed border-[#2f3445] hover:border-[#4edea3] rounded-xl p-6 bg-[#080e1d] flex flex-col items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-[#4edea3] text-[36px]">picture_as_pdf</span>
                  <div className="text-center">
                    <p className="font-bold text-sm text-[#dde2f8]">Upload CricHeroes / Match Report PDF or Image</p>
                    <p className="text-xs text-[#bbcabf]">Supports .pdf, .png, .jpg files up to 10MB</p>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="scorecard-pdf-input"
                  />
                  <label
                    htmlFor="scorecard-pdf-input"
                    className="mt-2 h-9 px-4 bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-[#10b981]/30 shadow"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    <span>Browse PDF File</span>
                  </label>

                  {file && (
                    <div className="mt-2 px-3 py-1 bg-[#10b981]/20 text-[#4edea3] rounded border border-[#10b981]/30 text-xs font-mono font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Selected: {file.name} ({Math.round(file.size / 1024)} KB)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PASTE RAW TEXT */}
            {activeInputTab === 'text' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#bbcabf]">Paste Raw Scorecard Text / Summary</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Paste match text here, e.g.:\n46 Brigade vs 24 Eng Brigade\n46 Brigade 159/6 (20.0 ov)\n24 Eng Brigade 122/8 (20.0 ov)\n\nMonjurul c Smith b Jones 27 18 5 1\nDevdutt Padikkal not out 42 26 5 3\n...`}
                  className="w-full h-40 p-3 bg-[#080e1d] border border-[#2f3445] rounded-xl text-xs font-mono text-[#dde2f8] outline-none focus:border-[#4edea3]"
                />
              </div>
            )}

            {/* TAB 3: FAST MANUAL SCORECARD BUILDER */}
            {activeInputTab === 'builder' && (
              <div className="p-4 bg-[#080e1d] border border-[#2f3445] rounded-xl flex flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-[#3198dc] text-[36px]">edit_note</span>
                <div>
                  <h4 className="font-bold text-sm text-[#dde2f8]">Fast Interactive Scorecard Builder</h4>
                  <p className="text-xs text-[#bbcabf] max-w-md mt-1">
                    Directly type or edit match scores, batting rows, and bowling figures in clean tabular forms without uploading files.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartFastBuilder}
                  className="h-9 px-5 bg-[#3198dc] text-white font-bold text-xs rounded-lg hover:brightness-110 shadow flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Launch Scorecard Builder</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] text-xs font-semibold"
              >
                Cancel
              </button>

              {activeInputTab !== 'builder' && (
                <button
                  type="button"
                  onClick={handleAnalyzeAndExtract}
                  disabled={isParsing || (!pastedText.trim() && !file)}
                  className="h-9 px-5 bg-[#4edea3] text-[#003824] font-extrabold text-xs rounded-lg hover:brightness-110 shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>{ocrStatus || 'Parsing Scorecard...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      <span>Extract & Process Scorecard →</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: TEAM ALIGNMENT & ANONYMIZE SETTINGS */}
        {step === 2 && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 bg-[#191f2f] rounded-lg border border-[#2f3445] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#dde2f8] block">Match Summary Header</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={matchData.team1 || ''}
                    onChange={(e) => setMatchData({ ...matchData, team1: e.target.value })}
                    className="h-7 px-2 bg-[#080e1d] border border-[#2f3445] rounded font-bold text-[#dde2f8]"
                  />
                  <input
                    type="text"
                    value={matchData.team1Score || ''}
                    onChange={(e) => setMatchData({ ...matchData, team1Score: e.target.value })}
                    className="h-7 px-2 w-20 text-center bg-[#080e1d] border border-[#2f3445] rounded font-mono text-[#4edea3]"
                  />
                  <span className="text-[#bbcabf]">vs</span>
                  <input
                    type="text"
                    value={matchData.team2 || ''}
                    onChange={(e) => setMatchData({ ...matchData, team2: e.target.value })}
                    className="h-7 px-2 bg-[#080e1d] border border-[#2f3445] rounded font-bold text-[#dde2f8]"
                  />
                  <input
                    type="text"
                    value={matchData.team2Score || ''}
                    onChange={(e) => setMatchData({ ...matchData, team2Score: e.target.value })}
                    className="h-7 px-2 w-20 text-center bg-[#080e1d] border border-[#2f3445] rounded font-mono text-[#4edea3]"
                  />
                </div>
              </div>
            </div>

            {/* Select Our Team Choice */}
            <div className="flex flex-col gap-2 bg-[#080e1d] p-3 rounded-xl border border-[#2f3445]">
              <label className="font-bold text-[#dde2f8] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#4edea3]">groups</span>
                <span>Select Which Side Is OUR TEAM (Squad Pool Alignment):</span>
              </label>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setOurTeamChoice('team1')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    ourTeamChoice === 'team1'
                      ? 'bg-[#10b981]/20 border-[#4edea3] ring-1 ring-[#4edea3]'
                      : 'bg-[#151b2b] border-[#2f3445] hover:border-[#3c4a42]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#dde2f8] text-sm">{matchData.team1 || 'Team 1'}</span>
                    {ourTeamChoice === 'team1' && <span className="material-symbols-outlined text-[#4edea3] text-[18px]">check_circle</span>}
                  </div>
                  <span className="text-[11px] text-[#bbcabf] font-mono">1st Innings Batting ({innings1Batters.length} batters)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOurTeamChoice('team2')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    ourTeamChoice === 'team2'
                      ? 'bg-[#10b981]/20 border-[#4edea3] ring-1 ring-[#4edea3]'
                      : 'bg-[#151b2b] border-[#2f3445] hover:border-[#3c4a42]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#dde2f8] text-sm">{matchData.team2 || 'Team 2'}</span>
                    {ourTeamChoice === 'team2' && <span className="material-symbols-outlined text-[#4edea3] text-[18px]">check_circle</span>}
                  </div>
                  <span className="text-[11px] text-[#bbcabf] font-mono">2nd Innings Batting ({innings2Batters.length} batters)</span>
                </button>
              </div>
            </div>

            {/* Anonymize Opponent Option */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#080e1d] border border-[#2f3445] cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[#dde2f8]">Auto-Anonymize Opponent Name & Roster</span>
                <span className="text-[10px] text-[#bbcabf]">
                  Converts opponent team to "Opponent XI" to keep tactical database focused solely on local squad players.
                </span>
              </div>
              <input
                type="checkbox"
                checked={anonymizeOpponent}
                onChange={(e) => setAnonymizeOpponent(e.target.checked)}
                className="w-4 h-4 accent-[#4edea3]"
              />
            </label>

            <div className="flex items-center justify-between pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] text-xs font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="h-8 px-4 rounded bg-[#4edea3] text-[#003824] text-xs font-bold hover:brightness-110 shadow"
              >
                Review Innings Figures →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SCORECARD REVIEW & EDIT WORKBENCH */}
        {step === 3 && (
          <div className="flex flex-col gap-3 text-xs">
            {/* Innings Selector Header */}
            <div className="flex items-center justify-between p-2 bg-[#080e1d] rounded-xl border border-[#2f3445]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedInningsView('team1')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    selectedInningsView === 'team1' ? 'bg-[#4edea3] text-[#003824]' : 'text-[#bbcabf] hover:text-[#dde2f8]'
                  }`}
                >
                  Innings 1: {matchData.team1} ({matchData.team1Score})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInningsView('team2')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    selectedInningsView === 'team2' ? 'bg-[#4edea3] text-[#003824]' : 'text-[#bbcabf] hover:text-[#dde2f8]'
                  }`}
                >
                  Innings 2: {matchData.team2} ({matchData.team2Score})
                </button>
              </div>

              <div className="flex items-center gap-1 bg-[#151b2b] p-1 rounded-lg border border-[#2f3445]">
                <button
                  type="button"
                  onClick={() => setRawReviewTab('batters')}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                    rawReviewTab === 'batters' ? 'bg-[#2f3445] text-[#4edea3]' : 'text-[#bbcabf]'
                  }`}
                >
                  Batters ({currentViewBatters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRawReviewTab('bowlers')}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                    rawReviewTab === 'bowlers' ? 'bg-[#2f3445] text-[#93ccff]' : 'text-[#bbcabf]'
                  }`}
                >
                  Bowlers ({currentViewBowlers.length})
                </button>
              </div>
            </div>

            {/* TABULAR EDIT TABLE */}
            {rawReviewTab === 'batters' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-[#bbcabf]">Batter Name & Dismissal</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#bbcabf]">R / B / 4s / 6s</span>
                    <button
                      type="button"
                      onClick={handleAddBatterRow}
                      className="px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] hover:bg-[#4edea3]/30 font-bold text-[11px] border border-[#4edea3]/40 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>Add Batter Row</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#080e1d] p-2 flex flex-col gap-1.5">
                  {currentViewBatters.map((b, idx) => (
                    <div key={b.id} className="p-2 bg-[#151b2b] border border-[#2f3445] rounded-lg grid grid-cols-12 gap-2 items-center text-[11px]">
                      <input
                        type="text"
                        value={b.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const setter = selectedInningsView === 'team1' ? setInnings1Batters : setInnings2Batters;
                          setter((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                        }}
                        className="col-span-4 h-7 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] font-bold outline-none focus:border-[#4edea3]"
                      />
                      <input
                        type="text"
                        value={b.dismissal}
                        onChange={(e) => {
                          const val = e.target.value;
                          const setter = selectedInningsView === 'team1' ? setInnings1Batters : setInnings2Batters;
                          setter((prev) => prev.map((item, i) => (i === idx ? { ...item, dismissal: val } : item)));
                        }}
                        className="col-span-4 h-7 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-[#bbcabf] outline-none"
                      />
                      <div className="col-span-4 grid grid-cols-4 gap-1">
                        <input
                          type="number"
                          title="Runs"
                          value={b.runs}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Batters : setInnings2Batters;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, runs: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#4edea3] font-bold"
                        />
                        <input
                          type="number"
                          title="Balls"
                          value={b.balls}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Batters : setInnings2Batters;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, balls: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                        />
                        <input
                          type="number"
                          title="4s"
                          value={b.fours}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Batters : setInnings2Batters;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, fours: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                        />
                        <input
                          type="number"
                          title="6s"
                          value={b.sixes}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Batters : setInnings2Batters;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, sixes: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rawReviewTab === 'bowlers' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-[#bbcabf]">Bowler Name</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#bbcabf]">O / M / R / W</span>
                    <button
                      type="button"
                      onClick={handleAddBowlerRow}
                      className="px-2 py-0.5 rounded bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold text-[11px] border border-[#3198dc]/40 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>Add Bowler Row</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#080e1d] p-2 flex flex-col gap-1.5">
                  {currentViewBowlers.map((bw, idx) => (
                    <div key={bw.id} className="p-2 bg-[#151b2b] border border-[#2f3445] rounded-lg grid grid-cols-12 gap-2 items-center text-[11px]">
                      <input
                        type="text"
                        value={bw.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const setter = selectedInningsView === 'team1' ? setInnings1Bowlers : setInnings2Bowlers;
                          setter((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                        }}
                        className="col-span-5 h-7 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] font-bold outline-none focus:border-[#4edea3]"
                      />
                      <div className="col-span-7 grid grid-cols-4 gap-1">
                        <input
                          type="number"
                          step="0.1"
                          title="Overs"
                          value={bw.overs}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Bowlers : setInnings2Bowlers;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, overs: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                        />
                        <input
                          type="number"
                          title="Maidens"
                          value={bw.maidens}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Bowlers : setInnings2Bowlers;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, maidens: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                        />
                        <input
                          type="number"
                          title="Runs Conceded"
                          value={bw.runs}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Bowlers : setInnings2Bowlers;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, runs: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                        />
                        <input
                          type="number"
                          title="Wickets"
                          value={bw.wickets}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const setter = selectedInningsView === 'team1' ? setInnings1Bowlers : setInnings2Bowlers;
                            setter((prev) => prev.map((item, i) => (i === idx ? { ...item, wickets: val } : item)));
                          }}
                          className="h-7 px-1 text-center bg-[#080e1d] border border-[#2f3445] rounded text-[#4edea3] font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] text-xs font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="h-8 px-4 rounded bg-[#4edea3] text-[#003824] text-xs font-bold hover:brightness-110 shadow"
              >
                Squad Link Workbench →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SQUAD LINK WORKBENCH & FINAL SYNC */}
        {step === 4 && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 bg-[#191f2f] rounded-lg border border-[#2f3445] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-[#dde2f8]">
                Link Our Team ({ourTeamChoice === 'team1' ? matchData.team1 : matchData.team2}) Batters to Squad Pool:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAutoLinkSquad}
                  className="px-2.5 py-1 rounded bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold text-[11px] border border-[#3198dc]/40 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                  <span>Auto-Detect Links</span>
                </button>

                {unlinkedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchRegisterUnlinked}
                    className="px-2.5 py-1 rounded bg-[#4edea3] text-[#003824] hover:brightness-110 font-extrabold text-[11px] shadow flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">person_add</span>
                    <span>+ Register All Unlinked</span>
                  </button>
                )}

                <span className="px-2 py-1 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-[11px] border border-[#10b981]/30 font-bold">
                  {unlinkedCount === 0 ? 'All Linked!' : `${unlinkedCount} Unlinked`}
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#080e1d] p-3 flex flex-col gap-2">
              {activeOurBatters.map((b) => {
                const assocId = nameAssociation[b.id] || 'unlinked';
                const suggested = findMatchingSquadPlayer(b.name, playersPool);

                return (
                  <div key={b.id} className="p-2.5 bg-[#151b2b] border border-[#2f3445] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#dde2f8]">{b.name}</span>
                        {suggested && (
                          <span className="px-1.5 py-0.5 rounded bg-[#3198dc]/20 text-[#93ccff] text-[10px] font-mono border border-[#3198dc]/30">
                            {Math.round(suggested.confidence * 100)}% Match: {suggested.player.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#bbcabf] font-mono">{b.runs} runs ({b.balls}b) • {b.dismissal}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={assocId}
                        onChange={(e) => setNameAssociation({ ...nameAssociation, [b.id]: e.target.value })}
                        className="h-8 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-xs text-[#dde2f8] outline-none focus:border-[#4edea3]"
                      >
                        <option value="unlinked">⚠️ Unlinked Scorecard Player</option>
                        {playersPool.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (#{p.jerseyNum})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] text-xs font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleAcceptAndApply}
                className="h-9 px-5 rounded bg-[#4edea3] text-[#003824] text-xs font-extrabold hover:brightness-110 flex items-center gap-1.5 shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Accept & Sync Scorecard</span>
              </button>
            </div>
          </div>
        )}

        {/* DIAGNOSTIC DRAWER OVERLAY */}
        {showDiagnosticDrawer && diagnosticLog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#080e1d] border border-[#3198dc]/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-xs text-[#dde2f8] my-auto">
              <div className="flex items-center justify-between border-b border-[#2f3445] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#3198dc] text-[22px]">bug_report</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#dde2f8]">PDF Raw Extraction & Player Matching Diagnostic Report</h3>
                    <p className="text-[11px] text-[#bbcabf] font-mono">
                      {diagnosticLog.fileInfo.name} ({Math.round(diagnosticLog.fileInfo.size / 1024)} KB) • {diagnosticLog.timestamp}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticDrawer(false)}
                  className="p-1 rounded bg-[#242a3a] text-[#bbcabf] hover:text-[#dde2f8]"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Player Match Confidence Table */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-[#4edea3] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  <span>Extracted PDF Players vs Squad Roster Matching Ledger</span>
                </span>
                <div className="max-h-48 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#151b2b] p-2.5 flex flex-col gap-1.5 font-mono">
                  {diagnosticLog.playerMatchDetails.map((pd, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#080e1d] border border-[#2f3445]">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#242a3a] text-[#bbcabf] text-[10px]">
                          {pd.team}
                        </span>
                        <span className="font-bold text-[#dde2f8]">{pd.extractedName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {pd.matchedPlayerName ? (
                          <span className="text-[#4edea3]">→ Matched: <strong>{pd.matchedPlayerName}</strong> ({Math.round(pd.confidence * 100)}%)</span>
                        ) : (
                          <span className="text-[#ffb4ab]">⚠️ Unlinked / No Match Found</span>
                        )}
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          pd.status === 'EXACT_MATCH' ? 'bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30' :
                          pd.status === 'FUZZY_MATCH' ? 'bg-[#3198dc]/20 text-[#93ccff] border border-[#3198dc]/30' :
                          'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                        }`}>
                          {pd.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw String Stream Output */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-[#3198dc] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">data_object</span>
                  <span>Raw Text Stream Extracted from PDF Buffer</span>
                </span>
                <textarea
                  readOnly
                  value={diagnosticLog.rawExtractedPdfText || '(No plain text stream. Pure visual PDF Base64 passed to Gemini Multimodal OCR Engine)'}
                  className="w-full h-32 p-3 bg-[#151b2b] border border-[#2f3445] rounded-xl font-mono text-[11px] text-[#dde2f8] outline-none"
                />
              </div>

              {/* Gemini Raw AI Output */}
              {diagnosticLog.geminiRawOutput && (
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-[#ffb95f] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    <span>Gemini AI Raw Model Extraction JSON</span>
                  </span>
                  <textarea
                    readOnly
                    value={diagnosticLog.geminiRawOutput}
                    className="w-full h-28 p-3 bg-[#151b2b] border border-[#2f3445] rounded-xl font-mono text-[11px] text-[#dde2f8] outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#2f3445]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(diagnosticLog, null, 2));
                    onShowToast('Copied diagnostic report JSON to clipboard!');
                  }}
                  className="h-8 px-3 bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold rounded-lg border border-[#3198dc]/40 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copy Diagnostic Report JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDiagnosticDrawer(false)}
                  className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] font-semibold"
                >
                  Close Diagnostics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
