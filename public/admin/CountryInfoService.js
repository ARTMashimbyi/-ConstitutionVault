// CountryInfoService.js
// This class encapsulates calls to the RestCountries API and picks the best matching result.

class CountryInfoService {
  constructor() {
    // Base URL for the RestCountries API.
    this.baseUrl = 'https://restcountries.com/v3.1';
    // If the global CountryAliases class is available, instantiate it.
    this.countryAliases = (typeof CountryAliases !== "undefined")
      ? new CountryAliases()
      : null;
  }

  /**
   * Retrieves country information based on the given query.
   * This method sends a request to the RestCountries API using partial matching.
   * It attempts to choose the best match by:
   *   1. Converting the query to a canonical name (using CountryAliases if available).
   *   2. Searching for an exact match on the country's common name.
   *   3. Looking for a name that starts with the canonical query.
   *   4. Otherwise selecting the result with the highest population.
   *
   * @param {string} query - The country query (e.g., "china", "botswana", "us", "england").
   * @returns {Promise<Object>} - A promise that resolves to a country object.
   * @throws Will throw an error if no country is found.
   */
  async getCountryInfo(query) {
    // Normalize and convert query using CountryAliases if available.
    let canonicalQuery = query.toLowerCase().trim();
    if (this.countryAliases) {
      // This should convert aliases like "england" to "united kingdom"
      canonicalQuery = this.countryAliases.getCanonicalName(query);
    } else {
      // Fallback: if no CountryAliases available, handle "us"/"usa" manually.
      if (canonicalQuery === "us" || canonicalQuery === "usa") {
        canonicalQuery = "united states";
      }
    }

    const endpoint = `${this.baseUrl}/name/${encodeURIComponent(canonicalQuery)}`;
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Country not found for query: "${query}"`);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No results returned for query: "${query}"`);
      }

      const lowerQuery = canonicalQuery; // already normalized/canonicalized
      
      // 1. Try to find an exact match on common name.
      let bestMatch = data.find(item => 
        item.name && item.name.common && item.name.common.toLowerCase() === lowerQuery
      );

      // 2. If no exact match, try finding one whose name starts with the query.
      if (!bestMatch) {
        bestMatch = data.find(item =>
          item.name && item.name.common && item.name.common.toLowerCase().startsWith(lowerQuery)
        );
      }

      // 3. If still no best match, choose the result with the highest population.
      if (!bestMatch) {
        bestMatch = data.reduce((prev, curr) => {
          const prevPop = prev.population || 0;
          const currPop = curr.population || 0;
          return currPop > prevPop ? curr : prev;
        });
      }

      return bestMatch;
    } catch (err) {
      console.error("Error in getCountryInfo:", err);
      throw err;
    }
  }

  /**
   * Retrieves information for bordering countries.
   * Accepts an array of country codes (ISO alpha-2 or alpha-3) and returns an array of country objects.
   * 
   * @param {Array<string>} borders - An array of border country codes.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of country objects.
   */
  async getBorderCountries(borders) {
    const promises = borders.map(async code => {
      try {
        const response = await fetch(`${this.baseUrl}/alpha/${encodeURIComponent(code)}`);
        if (!response.ok) {
          throw new Error(`Country not found for code: "${code}"`);
        }
        const data = await response.json();
        return data[0];
      } catch (err) {
        console.error(`Error fetching country for code "${code}":`, err);
        return null;
      }
    });
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
}

// Export for module systems or attach to the global window object for browser usage.
if (typeof module !== "undefined" && module.exports) {
  module.exports = CountryInfoService;
} else {
  window.CountryInfoService = CountryInfoService;
}