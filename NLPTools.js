// // NLPTools.js

// // For a plain browser environment, you cannot use require().
// // Instead, include external libraries via <script> tags if needed.
// // For example:
// // <script src="https://cdn.jsdelivr.net/npm/natural@0.6.3/lib/natural.js"></script>
// // <script src="https://cdn.jsdelivr.net/npm/franc@6.1.0/dist/franc.min.js"></script>

// // Check if the natural library is loaded; otherwise, provide a fallback.
// const naturalStemmer = (typeof natural !== 'undefined' && natural.PorterStemmer)
//   ? natural.PorterStemmer
//   : {
//       stem: (word) => word  // Fallback: no stemming performed.
//     };

// // Check if franc is available for language detection.
// const detectLang = (typeof franc === 'function')
//   ? franc
//   : (query) => "und";  // Fallback: undetermined language.

// //////////////////////////////
// // QueryEnhancer Class
// //////////////////////////////
// class QueryEnhancer {
//   constructor() {
//     // Basic stop words list (expand as needed).
//     this.stopWords = new Set([
//       "a", "an", "and", "are", "as", "at", "be", "by", "for",
//       "from", "has", "he", "in", "is", "it", "its", "of", "on",
//       "that", "the", "to", "was", "were", "will", "with"
//     ]);
//     // Use the natural PorterStemmer if available, otherwise fallback defined above.
//     this.stemmer = naturalStemmer;
//   }

//   /**
//    * Refines the input query by normalizing text, removing punctuation,
//    * tokenizing, removing stop words, and applying stemming.
//    * @param {string} query - The raw search query.
//    * @returns {Array<string>} - An array of refined keywords.
//    */
//   refine(query) {
//     if (!query || typeof query !== "string") return [];
    
//     // Normalize: convert to lowercase.
//     let normalized = query.toLowerCase();
    
//     // Remove punctuation.
//     normalized = normalized.replace(/[^\w\s]/g, '');
    
//     // Tokenize the query (split by whitespace).
//     const tokens = normalized.split(/\s+/);
    
//     // Remove stop words and stem the tokens.
//     const refinedTokens = tokens.filter(token => token && !this.stopWords.has(token))
//                                   .map(token => this.stemmer.stem(token));
    
//     return refinedTokens;
//   }
// }

// //////////////////////////////
// // LanguageSupport Class
// //////////////////////////////
// class LanguageSupport {
//   constructor() {
//     // In this implementation, we use LibreTranslate which does not require an API key.
//     this.endpoint = "https://libretranslate.de/translate";
//   }

//   /**
//    * Detects the language of the query.
//    * For simplicity, this method uses a stub returning "auto".
//    * In production, you might call an actual detection endpoint.
//    * @param {string} query - The input query.
//    * @returns {string} - The detected language code (e.g., "en", "zh"), here "auto" so LibreTranslate auto-detects.
//    */
//   detectLanguage(query) {
//     // Return "auto" to let LibreTranslate auto-detect, or implement your own detection.
//     return "auto";
//   }

//   /**
//    * Translates the input query to the target language using LibreTranslate.
//    * @param {string} query - The text to translate.
//    * @param {string} targetLang - The target language code (ISO 639-1 code, e.g., "en" for English).
//    * @returns {Promise<string>} - A promise that resolves to the translated text.
//    */
//   async translate(query, targetLang) {
//     const body = JSON.stringify({
//       q: query,
//       source: "auto",  // Let LibreTranslate auto-detect
//       target: targetLang, // e.g., "en" for English
//       format: "text"
//     });
    
//     try {
//       const response = await fetch(this.endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: body
//       });

//       if (!response.ok) {
//         throw new Error(`Translation API error: ${response.statusText}`);
//       }

//       const data = await response.json();
//       // Expected response format: { translatedText: "translated string" }
//       return data.translatedText || query;
//     } catch (error) {
//       console.error("Translation error:", error);
//       throw error;
//     }
//   }
// }

// // -----------------------
// // Module Export / Global Assignment
// // -----------------------
// if (typeof module !== "undefined" && module.exports) {
//   module.exports = { QueryEnhancer, LanguageSupport };
// } else {
//   window.QueryEnhancer = QueryEnhancer;
//   window.LanguageSupport = LanguageSupport;
// }
