import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { Candidate, RecommendationType } from './CustomerSuccessManager';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface ParsedResumeData {
  name: string;
  location: string;
  currentRole: string;
  currentCompany: string;
  experiences: Array<{
    role: string;
    company: string;
    period: string;
  }>;
  skills: string[];
  education: string[];
}

export class ResumeParser {
  private static instance: ResumeParser;
  
  static getInstance(): ResumeParser {
    if (!ResumeParser.instance) {
      ResumeParser.instance = new ResumeParser();
    }
    return ResumeParser.instance;
  }

  async parseFile(file: File): Promise<string> {
    const fileType = file.type;
    
    try {
      if (fileType === 'application/pdf') {
        return await this.parsePDF(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.parseDOCX(file);
      } else if (fileType === 'text/plain') {
        return await this.parseTXT(file);
      } else if (fileType === 'application/msword') {
        // For .doc files, try to read as text (limited support)
        return await this.parseTXT(file);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error('Failed to parse resume file');
    }
  }

  private async parsePDF(file: File): Promise<string> {
    try {
      console.log('=== PDF PARSING STARTED ===');
      console.log('PDF file name:', file.name);
      console.log('PDF file size:', file.size);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('PDF ArrayBuffer size:', arrayBuffer.byteLength);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      
      let text = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing PDF page ${i}/${pdf.numPages}`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        console.log(`Page ${i} text items:`, textContent.items.length);
        
        // Try different approaches to extract text
        const pageTextItems = textContent.items.map((item: any) => {
          console.log('Text item:', {
            str: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height
          });
          return item.str;
        });
        
        // Method 1: Simple join with spaces
        const pageTextSpaces = pageTextItems.join(' ');
        
        // Method 2: Try to preserve line breaks based on positioning
        const pageTextLines = this.reconstructPDFLines(textContent.items);
        
        console.log(`Page ${i} text (spaces):`, pageTextSpaces.substring(0, 200));
        console.log(`Page ${i} text (lines):`, pageTextLines.substring(0, 200));
        
        // Use the line-based version if it seems better structured
        const pageText = pageTextLines.length > pageTextSpaces.length ? pageTextLines : pageTextSpaces;
        text += pageText + '\n\n';
      }
      
      console.log('=== PDF PARSING COMPLETED ===');
      console.log('Total extracted text length:', text.length);
      console.log('First 500 characters:', text.substring(0, 500));
      console.log('Text preview by lines:', text.split('\n').slice(0, 15));
      
      return text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }
  
  private reconstructPDFLines(textItems: any[]): string {
    // Group text items by their Y position (approximate line detection)
    const lines: { [key: string]: { items: any[], y: number } } = {};
    
    textItems.forEach(item => {
      const y = Math.round(item.transform[5]); // Y position
      const yKey = y.toString();
      
      if (!lines[yKey]) {
        lines[yKey] = { items: [], y };
      }
      lines[yKey].items.push(item);
    });
    
    // Sort lines by Y position (top to bottom)
    const sortedLines = Object.values(lines).sort((a, b) => b.y - a.y);
    
    // For each line, sort items by X position (left to right)
    const reconstructedText = sortedLines.map(line => {
      const sortedItems = line.items.sort((a, b) => a.transform[4] - b.transform[4]);
      return sortedItems.map(item => item.str).join(' ').trim();
    }).filter(line => line.length > 0).join('\n');
    
    return reconstructedText;
  }

  private async parseDOCX(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      let text = result.value;
      
      // Clean up common DOCX artifacts and metadata
      text = text
        .replace(/Document Reader/gi, '') // Remove "Document Reader" artifact
        .replace(/Microsoft Word/gi, '') // Remove Word metadata
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^\s+|\s+$/g, '') // Trim
      
      // Log for debugging
      console.log('Raw DOCX text before cleaning:', result.value);
      console.log('Cleaned DOCX text:', text);
      
      return text;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  private async parseTXT(file: File): Promise<string> {
    return await file.text();
  }

  extractResumeData(text: string): ParsedResumeData {
    console.log('=== STARTING RESUME DATA EXTRACTION ===');
    console.log('Input text length:', text.length);
    console.log('First 300 chars:', text.substring(0, 300));
    
    // Extract name (usually first line or after specific keywords)
    const name = this.extractName(text);
    console.log('Extracted name:', name);
    
    // Extract location
    const location = this.extractLocation(text);
    console.log('Extracted location:', location);
    
    // Extract current role and company
    const currentRole = this.extractCurrentRole(text);
    console.log('Extracted current role:', currentRole);
    
    const currentCompany = this.extractCurrentCompany(text);
    console.log('Extracted current company:', currentCompany);
    
    // Extract work experiences
    const experiences = this.extractExperiences(text);
    console.log('Extracted experiences:', experiences);
    console.log('Number of experiences found:', experiences.length);
    
    // Extract skills
    const skills = this.extractSkills(text);
    console.log('Extracted skills:', skills);
    
    // Extract education
    const education = this.extractEducation(text);
    console.log('Extracted education:', education);

    const result = {
      name,
      location,
      currentRole,
      currentCompany,
      experiences,
      skills,
      education
    };
    
    console.log('=== FINAL EXTRACTED DATA ===');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  }

  private extractName(text: string): string {
    console.log('Starting name extraction from text:', text.substring(0, 200));
    
    // Clean the text first - remove common document artifacts and profile summaries
    let cleanText = text
      .replace(/Document Reader/gi, '')
      .replace(/Microsoft Word/gi, '')
      .replace(/Page \d+/gi, '')
      .replace(/\f/g, ' ') // Remove form feeds
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Remove common profile summary indicators that might be confused with names
    const profileSummaryPatterns = [
      /(?:PROFILE SUMMARY|Profile Summary|PROFESSIONAL SUMMARY|Professional Summary|SUMMARY|Summary|OBJECTIVE|Objective|CAREER OBJECTIVE|Career Objective)[\s\S]*?(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi,
      /(?:A\s+(?:highly\s+)?(?:motivated|experienced|skilled|dedicated|results-driven)[\s\S]*?)(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi,
      /(?:Seeking|Looking for|Aspiring|Passionate about)[\s\S]*?(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi
    ];
    
    // Store profile summary for later exclusion but don't remove from original text yet
    let profileSummaryText = '';
    for (const pattern of profileSummaryPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        profileSummaryText += match[0] + ' ';
      }
    }
    
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Clean lines for name extraction:', lines.slice(0, 10));
    
    // Strategy 0: Priority check - look at the very first few lines before anything else
    console.log('Priority check: Looking at first 5 lines for name...');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      console.log(`Priority line ${i}:`, line);
      
      // Skip obvious non-name first lines
      if (line.toLowerCase().includes('resume') ||
          line.toLowerCase().includes('cv') ||
          line.toLowerCase().includes('profile') ||
          line.toLowerCase().includes('summary') ||
          line.toLowerCase().includes('naukri') ||
          line.includes('@') ||
          line.includes('http') ||
          line.length < 3) {
        continue;
      }
      
      // Check for camelCase names (like KomalWadhwani)
      if (/^[A-Z][a-z]*[A-Z][a-z]*[A-Z]?[a-z]*$/.test(line.trim()) && line.length > 5 && line.length < 30) {
        console.log('Found camelCase name in priority check:', line);
        return line.trim();
      }
      
      // Check for spaced names
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 3) {
        const allCapitalized = words.every(word => /^[A-Z][a-z]*$/.test(word));
        const reasonableLength = words.every(word => word.length >= 2 && word.length <= 15);
        
        if (allCapitalized && reasonableLength && line.length < 40) {
          console.log('Found spaced name in priority check:', line);
          return line.trim();
        }
      }
    }
    
    // Strategy 1: Look for name patterns (common name formats)
    const namePatterns = [
      /\b([A-Z][A-Z\s]{2,}[A-Z])\b/g, // ALL CAPS names like "SAI DIVYA KANTA"
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // Title case names like "John Smith"
      /^([A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)*)\s*$/m, // ALL CAPS at start of line
      /\b([A-Z][a-z]*[A-Z][a-z]*)\s*$/m, // CamelCase names like "KomalWadhwani"
      /^([A-Z][a-z]*[A-Z][a-z]*)\b/m, // CamelCase at start of line
      /([A-Z][a-z]+[A-Z][a-z]+(?:[A-Z][a-z]+)*)/g, // CamelCase anywhere
    ];
    
    for (const pattern of namePatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(cleanText)) !== null) {
        const name = match[1].trim();
        console.log('Testing potential name:', name);
        
        // Validate it's likely a name
        const words = name.split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && name.length <= 50) {
          // Check it's not a common false positive or profile summary
          const excludeWords = ['DOCUMENT', 'READER', 'RESUME', 'CV', 'MICROSOFT', 'WORD', 'PAGE', 'PROFILE', 'SUMMARY', 'PROFESSIONAL', 'EXPERIENCED', 'SKILLED', 'MOTIVATED', 'DEDICATED', 'SEEKING', 'LOOKING', 'ASPIRING', 'PASSIONATE'];
          const hasExcludedWord = words.some(word => excludeWords.includes(word.toUpperCase()));
          
          // Check if this name appears in profile summary (likely not a real name then)
          const appearsInProfileSummary = profileSummaryText.toLowerCase().includes(name.toLowerCase());
          
          // Check if it's too long (profile summaries tend to be longer)
          const isTooLong = name.length > 40;
          
          // Check if it contains common profile summary words
          const profileWords = ['years', 'experience', 'expertise', 'specializing', 'proven', 'track record', 'background', 'knowledge'];
          const hasProfileWords = profileWords.some(word => name.toLowerCase().includes(word));
          
          if (!hasExcludedWord && !appearsInProfileSummary && !isTooLong && !hasProfileWords) {
            console.log('Found name via pattern:', name);
            return name;
          } else {
            console.log('Rejected potential name (profile summary or excluded):', name);
          }
        }
      }
    }
    
    // Strategy 2: Look at the first few lines more carefully
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];
      console.log(`Checking line ${i}:`, line);
      
      // Skip obvious non-name lines including profile summaries
      if (line.includes('@') || 
          line.includes('http') || 
          line.toLowerCase().includes('phone') ||
          line.toLowerCase().includes('email') ||
          line.toLowerCase().includes('linkedin') ||
          line.toLowerCase().includes('resume') ||
          line.toLowerCase().includes('cv') ||
          line.toLowerCase().includes('document') ||
          line.toLowerCase().includes('reader') ||
          line.toLowerCase().includes('profile') ||
          line.toLowerCase().includes('summary') ||
          line.toLowerCase().includes('objective') ||
          line.toLowerCase().includes('years of experience') ||
          line.toLowerCase().includes('experienced') ||
          line.toLowerCase().includes('skilled') ||
          line.toLowerCase().includes('specializing') ||
          line.toLowerCase().includes('expertise') ||
          line.toLowerCase().includes('background') ||
          line.toLowerCase().includes('seeking') ||
          line.toLowerCase().includes('looking for') ||
          line.toLowerCase().includes('passionate about') ||
          /^\d/.test(line) ||
          line.includes('•') ||
          line.includes(':') ||
          line.length < 3 ||
          line.length > 60) {
        continue;
      }
      
      // Check if it looks like a name (different patterns)
      const words = line.split(/\s+/);
      
      // Pattern 1: Multiple words with capital letters
      if (words.length >= 2 && words.length <= 4) {
        const hasCapitalLetters = words.every(word => /^[A-Z]/.test(word));
        const isReasonableLength = words.every(word => word.length >= 2 && word.length <= 20);
        
        if (hasCapitalLetters && isReasonableLength) {
          console.log('Found multi-word name via line analysis:', line);
          return line;
        }
      }
      
      // Pattern 2: Single camelCase name
      if (words.length === 1) {
        const word = words[0];
        if (word.length > 5 && word.length < 25 && /^[A-Z][a-z]*[A-Z][a-z]*/.test(word)) {
          console.log('Found camelCase name via line analysis:', line);
          return line;
        }
      }
    }
    
    // Strategy 3: Look for name after common headers
    const nameHeaders = ['name:', 'candidate:', 'applicant:', 'full name:'];
    for (const header of nameHeaders) {
      const headerIndex = cleanText.toLowerCase().indexOf(header);
      if (headerIndex !== -1) {
        const afterHeader = cleanText.substring(headerIndex + header.length);
        const nextLine = afterHeader.split('\n')[0].trim();
        if (nextLine && nextLine.length > 2 && nextLine.length < 50) {
          console.log('Found name via header:', nextLine);
          return nextLine;
        }
      }
    }
    
    // Strategy 4: Split by spaces and look for name-like sequences
    const words = cleanText.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      // Check for single camelCase names
      const singleWord = words[i];
      if (singleWord.length > 5 && /^[A-Z][a-z]*[A-Z][a-z]*/.test(singleWord) && 
          singleWord.length < 30) {
        const excludeWords = ['DOCUMENT', 'READER', 'RESUME', 'CV', 'MICROSOFT', 'WORD', 'NAUKRI', 'EMAIL', 'PHONE', 'PROFILE', 'SUMMARY', 'PROFESSIONAL', 'EXPERIENCED', 'SEEKING'];
        const hasExcludedWord = excludeWords.some(word => singleWord.toUpperCase().includes(word));
        
        // Check if it appears in profile summary
        const appearsInProfileSummary = profileSummaryText.toLowerCase().includes(singleWord.toLowerCase());
        
        if (!hasExcludedWord && !appearsInProfileSummary) {
          console.log('Found camelCase name:', singleWord);
          return singleWord;
        }
      }
      
      // Check for two or three word names
      if (i + 1 < words.length) {
        const twoWords = `${words[i]} ${words[i + 1]}`;
        if (/^[A-Z][a-z]*\s+[A-Z][a-z]*$/.test(twoWords) && twoWords.length < 40) {
          const excludeWords = ['DOCUMENT', 'READER', 'RESUME', 'CV', 'MICROSOFT', 'WORD', 'NAUKRI'];
          const hasExcludedWord = excludeWords.some(word => twoWords.toUpperCase().includes(word));
          if (!hasExcludedWord) {
            console.log('Found two-word name:', twoWords);
            return twoWords;
          }
        }
      }
      
      if (i + 2 < words.length) {
        const threeWords = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (/^[A-Z][A-Z\s]+[A-Z]$/.test(threeWords) && threeWords.length < 50) {
          const excludeWords = ['DOCUMENT', 'READER', 'RESUME', 'CV', 'MICROSOFT', 'WORD', 'NAUKRI'];
          const hasExcludedWord = excludeWords.some(word => threeWords.includes(word));
          if (!hasExcludedWord) {
            console.log('Found three-word name:', threeWords);
            return threeWords;
          }
        }
      }
    }
    
    console.log('No name found, returning Unknown Name');
    return 'Unknown Name';
  }

  private extractLocation(text: string): string {
    console.log('Starting location extraction from text:', text.substring(0, 300));
    
    // Clean text and remove profile summaries first
    let cleanText = text
      .replace(/Document Reader/gi, '')
      .replace(/Microsoft Word/gi, '')
      .replace(/Page \d+/gi, '')
      .trim();
    
    // Remove profile summary sections that might be confused with location
    const profileSummaryPatterns = [
      /(?:PROFILE SUMMARY|Profile Summary|PROFESSIONAL SUMMARY|Professional Summary|SUMMARY|Summary|OBJECTIVE|Objective|CAREER OBJECTIVE|Career Objective)[\s\S]*?(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi,
      /(?:A\s+(?:highly\s+)?(?:motivated|experienced|skilled|dedicated|results-driven)[\s\S]*?)(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi,
      /(?:Seeking|Looking for|Aspiring|Passionate about)[\s\S]*?(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi
    ];
    
    for (const pattern of profileSummaryPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log('Removing profile summary from location extraction:', match[0].substring(0, 100));
        cleanText = cleanText.replace(pattern, '').trim();
      }
    }
    
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Clean lines for location extraction:', lines.slice(0, 15));
    
    // Strategy 1: Look for explicit location headers
    const locationHeaderRegex = /(?:Address|Location|Based in|Located in|City|Residence)[:\s]*([^\n]+)/i;
    const headerMatch = cleanText.match(locationHeaderRegex);
    if (headerMatch) {
      const location = headerMatch[1].trim();
      // Make sure it's not profile summary text
      if (!location.toLowerCase().includes('experience') && 
          !location.toLowerCase().includes('skilled') && 
          !location.toLowerCase().includes('seeking') &&
          location.length < 100) {
        console.log('Found location via header:', location);
        return location;
      }
    }

    // Strategy 2: Priority check - look at first 10 lines for location patterns
    console.log('Priority location check: Looking at first 10 lines...');
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      console.log(`Priority location line ${i}:`, line);
      
      // Skip lines that are clearly not locations
      if (line.toLowerCase().includes('profile') ||
          line.toLowerCase().includes('summary') ||
          line.toLowerCase().includes('experienced') ||
          line.toLowerCase().includes('skilled') ||
          line.toLowerCase().includes('seeking') ||
          line.toLowerCase().includes('years') ||
          line.toLowerCase().includes('objective') ||
          line.includes('@') ||
          line.includes('http') ||
          line.length < 5 ||
          line.length > 100) {
        continue;
      }
      
      // Check for Indian city patterns (common in Naukri resumes)
      const indianLocationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/;
      const indianMatch = line.match(indianLocationPattern);
      if (indianMatch && 
          !line.toLowerCase().includes('company') && 
          !line.toLowerCase().includes('university') &&
          !line.toLowerCase().includes('college')) {
        console.log('Found Indian location pattern:', line);
        return line.trim();
      }
      
      // Check for common location formats: "City, State" or "City, Country"
      const cityStatePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?$/;
      if (cityStatePattern.test(line)) {
        console.log('Found city-state pattern:', line);
        return line.trim();
      }
      
      // Check for single city names that are likely locations
      const singleCityPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/;
      if (singleCityPattern.test(line)) {
        const commonCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubballi', 'Tiruchirappalli', 'Bareilly', 'Mysore', 'Tiruppur', 'Gurgaon', 'Aligarh', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala'];
        
        if (commonCities.some(city => city.toLowerCase() === line.toLowerCase())) {
          console.log('Found common Indian city:', line);
          return line.trim();
        }
      }
    }

    // Strategy 3: Look for city, state patterns anywhere in text
    const cityStateRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(?:\d{5})?\b/g;
    let cityStateMatch;
    while ((cityStateMatch = cityStateRegex.exec(cleanText)) !== null) {
      const location = `${cityStateMatch[1].trim()}, ${cityStateMatch[2]}`;
      // Make sure it's not in profile summary context
      const context = cleanText.substring(Math.max(0, cityStateMatch.index - 50), cityStateMatch.index + 50);
      if (!context.toLowerCase().includes('experience') && 
          !context.toLowerCase().includes('skilled') && 
          !context.toLowerCase().includes('company')) {
        console.log('Found city-state pattern anywhere:', location);
        return location;
      }
    }

    // Strategy 4: Look for international patterns
    const intlLocationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    let intlMatch;
    while ((intlMatch = intlLocationPattern.exec(cleanText)) !== null) {
      const location = `${intlMatch[1].trim()}, ${intlMatch[2].trim()}`;
      // Check if it looks like a real location (not company, university, etc.)
      if (!location.toLowerCase().includes('university') && 
          !location.toLowerCase().includes('college') && 
          !location.toLowerCase().includes('company') &&
          !location.toLowerCase().includes('technologies') &&
          location.length < 50) {
        console.log('Found international location pattern:', location);
        return location;
      }
    }

    // Strategy 5: Look for common location indicators
    const commonLocations = ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Seattle', 'Boston', 'Austin', 'Denver', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
    for (const location of commonLocations) {
      if (cleanText.toLowerCase().includes(location.toLowerCase())) {
        // Make sure it's not in a company name or profile summary
        const locationIndex = cleanText.toLowerCase().indexOf(location.toLowerCase());
        const context = cleanText.substring(Math.max(0, locationIndex - 30), locationIndex + location.length + 30);
        if (!context.toLowerCase().includes('company') && 
            !context.toLowerCase().includes('technologies') &&
            !context.toLowerCase().includes('experience') &&
            !context.toLowerCase().includes('skilled')) {
          console.log('Found common location:', location);
          return location;
        }
      }
    }

    console.log('No location found, returning default');
    return 'Location not specified';
  }

  private extractCurrentRole(text: string): string {
    // Look for current role patterns
    const currentRolePatterns = [
      /Current(?:ly)?[:\s]*([^\n]+)/i,
      /Present[:\s]*([^\n]+)/i,
      /(?:Senior|Lead|Principal|Director|Manager|Specialist|Analyst|Engineer|Developer)\s+[^\n]+/i
    ];

    for (const pattern of currentRolePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 5) {
        return match[1].trim();
      }
    }

    // Extract from experience section
    const experiences = this.extractExperiences(text);
    if (experiences.length > 0) {
      return experiences[0].role;
    }

    return 'Role not specified';
  }

  private extractCurrentCompany(text: string): string {
    const experiences = this.extractExperiences(text);
    if (experiences.length > 0) {
      return experiences[0].company;
    }
    
    return 'Company not specified';
  }

  private extractExperiences(text: string): Array<{ role: string; company: string; period: string; }> {
    console.log('Starting experience extraction from text:', text.substring(0, 500));
    
    const experiences: Array<{ role: string; company: string; period: string; }> = [];
    
    // Clean text first and remove profile summaries
    let cleanText = text
      .replace(/Document Reader/gi, '')
      .replace(/Microsoft Word/gi, '')
      .replace(/\f/g, '\n') // Replace form feeds with newlines
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    console.log('Clean text for experience extraction:', cleanText.substring(0, 500));
    
    // Remove profile summary sections that might be mistaken for experience
    const profileSummaryPatterns = [
      /(?:PROFILE SUMMARY|Profile Summary|PROFESSIONAL SUMMARY|Professional Summary|SUMMARY|Summary|OBJECTIVE|Objective|CAREER OBJECTIVE|Career Objective)[\s\S]*?(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi,
      /(?:A\s+(?:highly\s+)?(?:motivated|experienced|skilled|dedicated|results-driven)[\s\S]*?)(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi,
      /(?:Seeking|Looking for|Aspiring|Passionate about)[\s\S]*?(?=\n\n|\n[A-Z]|\n\s*EXPERIENCE|\n\s*EDUCATION|\n\s*SKILLS|$)/gi
    ];
    
    // Store and remove profile summaries from experience extraction
    let profileSummaryRemoved = cleanText;
    for (const pattern of profileSummaryPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        console.log('Removing profile summary from experience extraction:', match[0].substring(0, 100));
        profileSummaryRemoved = profileSummaryRemoved.replace(pattern, '').trim();
      }
    }
    
    cleanText = profileSummaryRemoved;

    console.log('Clean text for experience extraction:', cleanText.substring(0, 500));
    
    // Strategy 1: Split text into sections by common experience headers
    const experienceHeaders = [
      /(?:PROFESSIONAL\s+EXPERIENCE|Professional\s+Experience)/i,
      /(?:WORK\s+EXPERIENCE|Work\s+Experience)/i,
      /(?:EMPLOYMENT\s+HISTORY|Employment\s+History)/i,
      /(?:EXPERIENCE|Experience)/i,
      /(?:EMPLOYMENT|Employment)/i,
      /(?:CAREER\s+HISTORY|Career\s+History)/i
    ];
    
    let experienceSection = '';
    let foundSection = false;
    
    for (const header of experienceHeaders) {
      const sections = cleanText.split(header);
      if (sections.length >= 2) {
        experienceSection = sections[1];
        foundSection = true;
        console.log('Found experience section via header:', header);
        break;
      }
    }
    
    if (!foundSection) {
      console.log('No experience section header found, using pattern-based extraction');
      return this.extractExperiencesByPattern(cleanText);
    }

    console.log('Experience section found:', experienceSection.substring(0, 300));

    // Strategy 2: Extract experiences from the experience section
    // Look for date patterns first, then extract context around them
    const datePattern = /(\w+\s+\d{4}|\d{4})\s*[-–—|]\s*(\w+\s+\d{4}|\d{4}|Present|Current)/gi;
    let match;
    
    while ((match = datePattern.exec(experienceSection)) !== null && experiences.length < 5) {
      const period = match[0];
      const matchIndex = match.index || 0;
      
      console.log('Found date pattern:', period, 'at index:', matchIndex);
      
      // Get context before the date (likely contains role and company)
      const beforeDate = experienceSection.substring(0, matchIndex);
      const afterDate = experienceSection.substring(matchIndex + period.length);
      
      // Split the before text into potential role/company candidates
      const beforeLines = beforeDate.split(/[.\n]/).map(line => line.trim()).filter(line => line.length > 0);
      const afterLines = afterDate.split(/[.\n]/).slice(0, 3).map(line => line.trim()).filter(line => line.length > 0);
      
      console.log('Before lines:', beforeLines.slice(-5));
      console.log('After lines:', afterLines.slice(0, 3));
      
      let role = '';
      let company = '';
      
      // Look for role and company in the lines before the date
      const relevantLines = beforeLines.slice(-10); // Last 10 lines before date
      
      for (let i = relevantLines.length - 1; i >= 0; i--) {
        const line = relevantLines[i];
        
        // Skip lines that are too short or contain unwanted content including profile summaries
        if (line.length < 3 || 
            line.includes('•') || 
            line.includes('-') ||
            line.toLowerCase().includes('responsibilities') ||
            line.toLowerCase().includes('achievements') ||
            line.toLowerCase().includes('profile') ||
            line.toLowerCase().includes('summary') ||
            line.toLowerCase().includes('objective') ||
            line.toLowerCase().includes('experienced') ||
            line.toLowerCase().includes('skilled') ||
            line.toLowerCase().includes('specializing') ||
            line.toLowerCase().includes('expertise') ||
            line.toLowerCase().includes('background') ||
            line.toLowerCase().includes('seeking') ||
            line.toLowerCase().includes('looking for') ||
            line.toLowerCase().includes('passionate') ||
            line.toLowerCase().includes('years of experience') ||
            line.toLowerCase().includes('proven track record')) {
          continue;
        }
        
        // Check if line looks like a company (contains common company indicators)
        const companyIndicators = ['inc', 'corp', 'company', 'ltd', 'llc', 'systems', 'solutions', 'technologies', 'services'];
        const looksLikeCompany = companyIndicators.some(indicator => 
          line.toLowerCase().includes(indicator)
        );
        
        // Check if line looks like a job title
        const jobTitleIndicators = ['manager', 'director', 'analyst', 'specialist', 'coordinator', 'associate', 'executive', 'lead', 'senior', 'junior'];
        const looksLikeJobTitle = jobTitleIndicators.some(indicator => 
          line.toLowerCase().includes(indicator)
        );
        
        if (looksLikeCompany && !company) {
          company = line;
          console.log('Found potential company:', company);
        } else if (looksLikeJobTitle && !role) {
          role = line;
          console.log('Found potential role:', role);
        } else if (!role && !looksLikeCompany) {
          // If we haven't found a role yet and this doesn't look like a company, it might be a role
          role = line;
          console.log('Found potential role (fallback):', role);
        }
        
        if (role && company) break;
      }
      
      // If we didn't find both role and company, try a different approach
      if (!role || !company) {
        const contextLines = [...relevantLines.slice(-3), ...afterLines.slice(0, 2)];
        for (const line of contextLines) {
          if (line.length > 3 && line.length < 100) {
            if (!role) {
              role = line;
              console.log('Fallback role:', role);
            } else if (!company) {
              company = line;
              console.log('Fallback company:', company);
              break;
            }
          }
        }
      }
      
      // Add the experience if we have at least a role
      if (role && role.length > 2) {
        const experience = {
          role: role.trim(),
          company: company || 'Company not specified',
          period: period.trim()
        };
        
        console.log('Adding experience:', experience);
        experiences.push(experience);
      }
      
      // Reset the regex lastIndex to continue searching
      datePattern.lastIndex = matchIndex + period.length;
    }

    console.log('Total experiences found:', experiences.length);
    
    // If no experiences found, try a simpler approach
    if (experiences.length === 0) {
      console.log('No experiences found with main method, trying simple extraction...');
      return this.extractExperiencesSimple(cleanText);
    }
    
    return experiences.slice(0, 5); // Limit to 5 experiences
  }

  private extractExperiencesByPattern(text: string): Array<{ role: string; company: string; period: string; }> {
    console.log('Using pattern-based experience extraction');
    const experiences: Array<{ role: string; company: string; period: string; }> = [];
    
    // Enhanced pattern to match date ranges
    const datePattern = /(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—|]\s*(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|Present|Current)/gi;
    let match;
    
    // Use exec in a loop instead of matchAll for better compatibility
    while ((match = datePattern.exec(text)) !== null && experiences.length < 5) {
      const period = match[0];
      const startIndex = match.index || 0;
      
      console.log('Pattern-based: Found date:', period, 'at index:', startIndex);
      
      // Get larger context around the date match
      const contextStart = Math.max(0, startIndex - 300);
      const contextEnd = Math.min(text.length, startIndex + 100);
      const context = text.substring(contextStart, contextEnd);
      
      console.log('Context around date:', context.substring(0, 200));
      
      // Extract role and company from context
      const beforeDateText = text.substring(contextStart, startIndex);
      const lines = beforeDateText.split(/[.\n]/).map(line => line.trim()).filter(line => line.length > 2);
      
      console.log('Lines before date:', lines.slice(-5));
      
      let role = '';
      let company = '';
      
      // Look at the last few lines before the date
      const relevantLines = lines.slice(-6); // Last 6 lines before date
      
      for (let i = relevantLines.length - 1; i >= 0; i--) {
        const line = relevantLines[i];
        
        // Skip lines with bullets, numbers, descriptions, or profile summaries
        if (line.includes('•') || 
            line.includes('-') || 
            /^\d/.test(line) ||
            line.toLowerCase().includes('responsible') ||
            line.toLowerCase().includes('manage') ||
            line.toLowerCase().includes('profile') ||
            line.toLowerCase().includes('summary') ||
            line.toLowerCase().includes('objective') ||
            line.toLowerCase().includes('experienced') ||
            line.toLowerCase().includes('skilled') ||
            line.toLowerCase().includes('specializing') ||
            line.toLowerCase().includes('expertise') ||
            line.toLowerCase().includes('background') ||
            line.toLowerCase().includes('seeking') ||
            line.toLowerCase().includes('passionate') ||
            line.toLowerCase().includes('years of experience') ||
            line.length > 80) {
          continue;
        }
        
        // Check if line looks like a company
        const companyWords = ['inc', 'corp', 'company', 'ltd', 'llc', 'systems', 'solutions', 'technologies', 'services', 'group', 'consulting'];
        const isCompany = companyWords.some(word => line.toLowerCase().includes(word));
        
        // Check if line looks like a job title
        const jobWords = ['manager', 'director', 'analyst', 'specialist', 'coordinator', 'associate', 'executive', 'lead', 'senior', 'junior', 'engineer', 'developer'];
        const isJobTitle = jobWords.some(word => line.toLowerCase().includes(word));
        
        if (isCompany && !company) {
          company = line;
          console.log('Pattern-based: Found company:', company);
        } else if (isJobTitle && !role) {
          role = line;
          console.log('Pattern-based: Found role:', role);
        } else if (!role && !isCompany && line.length > 5 && line.length < 60) {
          // Fallback: assume it's a role if it's reasonable length
          role = line;
          console.log('Pattern-based: Found role (fallback):', role);
        }
        
        if (role && company) break;
      }
      
      // If still missing information, try alternative approach
      if (!role || !company) {
        for (const line of relevantLines.slice(-3)) {
          if (line.length > 3 && line.length < 80) {
            if (!role) {
              role = line;
              console.log('Pattern-based: Fallback role:', role);
            } else if (!company) {
              company = line;
              console.log('Pattern-based: Fallback company:', company);
              break;
            }
          }
        }
      }
      
      if (role && role.length > 2) {
        const experience = {
          role: role.trim(),
          company: company || 'Company not specified',
          period: period.trim()
        };
        
        console.log('Pattern-based: Adding experience:', experience);
        experiences.push(experience);
      }
      
      // Prevent infinite loop
      datePattern.lastIndex = startIndex + period.length;
    }

    console.log('Pattern-based: Total experiences found:', experiences.length);
    
    // If still no experiences found, try the simplest approach
    if (experiences.length === 0) {
      console.log('No experiences found with pattern method, trying simple extraction...');
      return this.extractExperiencesSimple(text);
    }
    
    return experiences.slice(0, 5);
  }

  private extractExperiencesSimple(text: string): Array<{ role: string; company: string; period: string; }> {
    console.log('Using simple experience extraction as fallback');
    const experiences: Array<{ role: string; company: string; period: string; }> = [];
    
    // Look for any date patterns in the text
    const datePattern = /(\w+\s+\d{4}|\d{4})\s*[-–—|]\s*(\w+\s+\d{4}|\d{4}|Present|Current)/gi;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Simple extraction: Found', lines.length, 'lines');
    
    for (let i = 0; i < lines.length && experiences.length < 5; i++) {
      const line = lines[i];
      const dateMatch = line.match(datePattern);
      
      if (dateMatch) {
        console.log('Simple extraction: Found date in line:', line);
        
        // Look for role and company in nearby lines
        let role = '';
        let company = '';
        
        // Check previous lines for role/company (avoid profile summaries)
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevLine = lines[j];
          if (prevLine && prevLine.length > 3 && prevLine.length < 80 &&
              !prevLine.includes('@') && 
              !prevLine.includes('http') &&
              !prevLine.toLowerCase().includes('profile') &&
              !prevLine.toLowerCase().includes('summary') &&
              !prevLine.toLowerCase().includes('experienced') &&
              !prevLine.toLowerCase().includes('skilled') &&
              !prevLine.toLowerCase().includes('seeking') &&
              !prevLine.toLowerCase().includes('passionate') &&
              !prevLine.toLowerCase().includes('years of experience')) {
            if (!role) {
              role = prevLine;
              console.log('Simple extraction: Found role:', role);
            } else if (!company && prevLine !== role) {
              company = prevLine;
              console.log('Simple extraction: Found company:', company);
            }
          }
        }
        
        // If we still don't have role, use a generic one
        if (!role) {
          role = 'Professional Role';
        }
        
        if (!company) {
          company = 'Company';
        }
        
        experiences.push({
          role: role.trim(),
          company: company.trim(),
          period: dateMatch[0].trim()
        });
        
        console.log('Simple extraction: Added experience:', experiences[experiences.length - 1]);
      }
    }
    
    // If still no experiences, try PDF-specific patterns
    if (experiences.length === 0) {
      console.log('Simple extraction: Trying PDF-specific patterns...');
      
      // PDF resumes often have experience in format: "Company Name - Job Title - Duration"
      for (const line of lines) {
        // Pattern: Company - Title - Date or Title - Company - Date
        if (line.includes(' - ') && line.length > 10 && line.length < 150) {
          const parts = line.split(' - ').map(part => part.trim());
          if (parts.length >= 2) {
            // Check if any part contains a date
            const hasDate = parts.some(part => 
              /\d{4}/.test(part) || 
              part.toLowerCase().includes('present') ||
              part.toLowerCase().includes('current') ||
              /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(part)
            );
            
            if (hasDate) {
              const datePart = parts.find(part => 
                /\d{4}/.test(part) || 
                part.toLowerCase().includes('present') ||
                part.toLowerCase().includes('current') ||
                /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(part)
              ) || 'Work Period';
              
              const otherParts = parts.filter(part => part !== datePart);
              const role = otherParts[0] || 'Professional Role';
              const company = otherParts[1] || 'Company';
              
              experiences.push({
                role: role,
                company: company,
                period: datePart
              });
              
              console.log('Simple extraction: Found PDF-style experience:', experiences[experiences.length - 1]);
            }
          }
        }
      }
    }
    
    // Final fallback: create basic experience from job titles
    if (experiences.length === 0) {
      console.log('Simple extraction: No patterns found, creating basic experience from job titles');
      
      const jobTitles = ['manager', 'director', 'analyst', 'specialist', 'engineer', 'developer', 'coordinator', 'associate', 'executive', 'lead', 'senior'];
      let foundRole = '';
      
      for (const line of lines.slice(0, 20)) {
        if (jobTitles.some(title => line.toLowerCase().includes(title))) {
          foundRole = line;
          break;
        }
      }
      
      if (foundRole) {
        experiences.push({
          role: foundRole,
          company: 'Previous Company',
          period: 'Work Experience'
        });
        console.log('Simple extraction: Created basic experience:', experiences[0]);
      } else {
        // Ultra fallback: create generic experience
        experiences.push({
          role: 'Professional Experience',
          company: 'Previous Employer',
          period: 'Work History'
        });
        console.log('Simple extraction: Created generic experience');
      }
    }
    
    console.log('Simple extraction: Final experiences:', experiences);
    return experiences;
  }

  private extractPeriodFromText(text: string): string {
    const datePattern = /(\w+\s+\d{4}|\d{4})\s*[-–]\s*(\w+\s+\d{4}|\d{4}|Present|Current)/i;
    const match = text.match(datePattern);
    return match ? match[0] : 'Period not specified';
  }

  private extractSkills(text: string): string[] {
    const skillKeywords = [
      'Customer Success', 'Account Management', 'Client Relations', 'CRM', 'Salesforce',
      'HubSpot', 'Zendesk', 'Gainsight', 'ChurnZero', 'Customer Retention', 'Upselling',
      'Cross-selling', 'SaaS', 'B2B', 'Enterprise', 'Onboarding', 'Training',
      'Data Analysis', 'Excel', 'SQL', 'Tableau', 'PowerBI', 'Project Management',
      'Agile', 'Scrum', 'Communication', 'Leadership', 'Team Management'
    ];

    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();

    for (const skill of skillKeywords) {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  private extractEducation(text: string): string[] {
    const educationPatterns = [
      /(?:Bachelor|Master|MBA|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.)[^\n]+/gi,
      /(?:University|College|Institute)[^\n]+/gi
    ];

    const education: string[] = [];
    
    for (const pattern of educationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        education.push(...matches.slice(0, 3));
      }
    }

    return education;
  }

  generateCandidateFromResume(parsedData: ParsedResumeData): Candidate {
    console.log('=== GENERATING CANDIDATE FROM PARSED DATA ===');
    console.log('Input parsed data:', parsedData);
    console.log('Experiences being used:', parsedData.experiences);
    
    // Generate a score based on experience and skills
    const score = this.calculateScore(parsedData);
    console.log('Calculated score:', score);
    
    // Generate strengths and weaknesses
    const strengths = this.generateStrengths(parsedData);
    console.log('Generated strengths:', strengths);
    
    const weaknesses = this.generateWeaknesses(parsedData);
    console.log('Generated weaknesses:', weaknesses);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(score, parsedData);
    console.log('Generated recommendation:', recommendation);

    const candidate = {
      id: Date.now().toString(),
      name: parsedData.name,
      location: parsedData.location,
      currentRole: parsedData.currentRole,
      currentCompany: parsedData.currentCompany,
      score: Math.round(score * 10) / 10,
      experiences: parsedData.experiences,
      strengths,
      weaknesses,
      recommendation
    };
    
    console.log('=== FINAL GENERATED CANDIDATE ===');
    console.log('Candidate experiences:', candidate.experiences);
    console.log('Full candidate object:', candidate);
    
    return candidate;
  }

  private calculateScore(data: ParsedResumeData): number {
    let score = 5.0; // Base score

    // Experience bonus
    const experienceCount = data.experiences.length;
    score += Math.min(experienceCount * 0.5, 2.0);

    // Customer Success related skills
    const csSkills = data.skills.filter(skill => 
      skill.toLowerCase().includes('customer') || 
      skill.toLowerCase().includes('success') ||
      skill.toLowerCase().includes('account') ||
      skill.toLowerCase().includes('client')
    );
    score += Math.min(csSkills.length * 0.3, 1.5);

    // SaaS/Tech experience
    const techKeywords = ['SaaS', 'B2B', 'Software', 'Tech', 'CRM', 'Enterprise'];
    const hasTechExperience = data.experiences.some(exp => 
      techKeywords.some(keyword => 
        exp.company.toLowerCase().includes(keyword.toLowerCase()) ||
        exp.role.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    if (hasTechExperience) score += 0.8;

    // Leadership/Senior roles
    const hasLeadershipRole = data.experiences.some(exp =>
      exp.role.toLowerCase().includes('senior') ||
      exp.role.toLowerCase().includes('lead') ||
      exp.role.toLowerCase().includes('director') ||
      exp.role.toLowerCase().includes('manager')
    );
    if (hasLeadershipRole) score += 0.7;

    return Math.min(Math.max(score, 1.0), 10.0);
  }

  private generateStrengths(data: ParsedResumeData): string[] {
    const strengths: string[] = [];

    // Experience-based strengths
    if (data.experiences.length >= 3) {
      strengths.push(`${data.experiences.length}+ years in relevant roles`);
    }

    // Skills-based strengths
    const csSkills = data.skills.filter(skill => 
      skill.toLowerCase().includes('customer') || 
      skill.toLowerCase().includes('success')
    );
    if (csSkills.length > 0) {
      strengths.push('Strong Customer Success background');
    }

    // Industry experience
    const techCompanies = ['Salesforce', 'HubSpot', 'Zendesk', 'Microsoft', 'Google', 'Amazon'];
    const workedAtTechCompany = data.experiences.some(exp =>
      techCompanies.some(company => 
        exp.company.toLowerCase().includes(company.toLowerCase())
      )
    );
    if (workedAtTechCompany) {
      strengths.push('Experience at leading tech companies');
    }

    // Role progression
    const hasProgressedRoles = data.experiences.some(exp =>
      exp.role.toLowerCase().includes('senior') || 
      exp.role.toLowerCase().includes('lead')
    );
    if (hasProgressedRoles) {
      strengths.push('Demonstrated career progression');
    }

    // Add generic strengths if not enough specific ones
    if (strengths.length < 3) {
      strengths.push('Relevant industry experience');
      strengths.push('Strong communication skills');
    }

    return strengths.slice(0, 5);
  }

  private generateWeaknesses(data: ParsedResumeData): string[] {
    const weaknesses: string[] = [];

    // Limited experience
    if (data.experiences.length < 2) {
      weaknesses.push('Limited work experience');
    }

    // No customer success specific experience
    const hasCSExperience = data.experiences.some(exp =>
      exp.role.toLowerCase().includes('customer success') ||
      exp.role.toLowerCase().includes('customer') ||
      exp.role.toLowerCase().includes('account management')
    );
    if (!hasCSExperience) {
      weaknesses.push('No direct Customer Success experience');
    }

    // Generic weakness if none found
    if (weaknesses.length === 0) {
      weaknesses.push('May need additional training in specific tools');
    }

    return weaknesses.slice(0, 3);
  }

  private generateRecommendation(score: number, data: ParsedResumeData): RecommendationType {
    if (score >= 8.0) return 'approve';
    if (score >= 6.5) return 'hold';
    return 'reject';
  }
}

export const resumeParser = ResumeParser.getInstance();

// Add this to window for debugging
if (typeof window !== 'undefined') {
  (window as any).debugResumeParser = {
    testExtraction: (text: string) => {
      console.log('=== DEBUG: Testing Resume Extraction ===');
      const parser = ResumeParser.getInstance();
      const result = parser.extractResumeData(text);
      console.log('Debug result:', result);
      return result;
    },
    
    testExperienceExtraction: (text: string) => {
      console.log('=== DEBUG: Testing Experience Extraction Only ===');
      const parser = ResumeParser.getInstance();
      const experiences = (parser as any).extractExperiences(text);
      console.log('Debug experiences:', experiences);
      return experiences;
    },
    
    testNameExtraction: (text: string) => {
      console.log('=== DEBUG: Testing Name Extraction Only ===');
      const parser = ResumeParser.getInstance();
      const name = (parser as any).extractName(text);
      console.log('Debug name:', name);
      return name;
    },
    
    testLocationExtraction: (text: string) => {
      console.log('=== DEBUG: Testing Location Extraction Only ===');
      const parser = ResumeParser.getInstance();
      const location = (parser as any).extractLocation(text);
      console.log('Debug location:', location);
      return location;
    },
    
    testPDFTextStructure: (text: string) => {
      console.log('=== DEBUG: Analyzing PDF Text Structure ===');
      console.log('Total length:', text.length);
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      console.log('Total lines:', lines.length);
      console.log('First 20 lines:');
      lines.slice(0, 20).forEach((line, i) => {
        console.log(`${i + 1}: "${line}"`);
      });
      
      // Analyze first 5 lines specifically for names
      console.log('\n=== First 5 Lines Analysis ===');
      lines.slice(0, 5).forEach((line, i) => {
        const isCamelCase = /^[A-Z][a-z]*[A-Z][a-z]*[A-Z]?[a-z]*$/.test(line.trim());
        const isSpacedName = /^[A-Z][a-z]*\s+[A-Z][a-z]*(\s+[A-Z][a-z]*)?$/.test(line.trim());
        const hasProfileWords = line.toLowerCase().includes('profile') || 
                               line.toLowerCase().includes('summary') || 
                               line.toLowerCase().includes('experienced') ||
                               line.toLowerCase().includes('skilled');
        
        console.log(`Line ${i + 1}: "${line}"`);
        console.log(`  - CamelCase: ${isCamelCase}`);
        console.log(`  - Spaced Name: ${isSpacedName}`);
        console.log(`  - Has Profile Words: ${hasProfileWords}`);
        console.log(`  - Length: ${line.length}`);
      });
      
      // Look for profile summaries
      console.log('\n=== Profile Summary Detection ===');
      const profilePatterns = [
        /profile\s+summary/gi,
        /professional\s+summary/gi,
        /experienced\s+\w+/gi,
        /skilled\s+\w+/gi,
        /\d+\s+years?\s+of\s+experience/gi
      ];
      
      profilePatterns.forEach((pattern, i) => {
        const matches = [];
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null && matches.length < 5) {
          matches.push({
            text: match[0],
            index: match.index,
            line: text.substring(0, match.index).split('\n').length
          });
        }
        console.log(`Profile Pattern ${i + 1}:`, matches);
      });
      
      // Look for potential names
      console.log('\n=== Potential Names ===');
      const namePatterns = [
        /\b([A-Z][a-z]*[A-Z][a-z]*)\b/g,
        /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g
      ];
      
      namePatterns.forEach((pattern, i) => {
        const matches = [];
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null && matches.length < 10) {
          matches.push({
            name: match[1],
            index: match.index,
            line: text.substring(0, match.index).split('\n').length
          });
        }
        console.log(`Name Pattern ${i + 1}:`, matches);
      });
      
      return { lines: lines.slice(0, 20), analysis: 'complete' };
    }
  };
}