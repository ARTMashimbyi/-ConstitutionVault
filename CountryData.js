// CountryData.js
// This file defines classes for handling country aliases and facts.
// If you are using Node.js modules, these classes will be exported,
// otherwise they will be attached to the global window object.

//////////////////////////////
// CountryAliases Class
//////////////////////////////

class CountryAliases {
  constructor() {
    // Mapping of canonical country names (all in lowercase) to an array of known aliases.
    // You can expand this list to include more countries and multi-language synonyms.
    this.aliases = {
      "united states": ["us", "usa", "america", "the states"],
      "united kingdom": ["uk", "britain", "england", "gb"],
      "france": ["la france", "l'hexagone"],
      "germany": ["deutschland", "ger"],
      "india": ["bharat", "hindustan"],
      "russia": ["россия", "the russian federation"],
      "china": ["zhongguo", "中国"],
      // Add more countries as needed.
    };
  }

  /**
   * Returns the array of aliases for the given country.
   * @param {String} countryName - The canonical country name.
   * @returns {Array} - Array of aliases (strings). Returns an empty array if no aliases are found.
   */
  getAliases(countryName) {
    if (!countryName) return [];
    const normalized = countryName.toLowerCase().trim();
    return this.aliases[normalized] || [];
  }

  /**
   * Determines if a given query string matches a country name or any of its aliases.
   * @param {String} query - The search query to test.
   * @param {String} countryName - The country name to compare against.
   * @returns {Boolean} - True if the query matches the country name or one of its aliases.
   */
  matches(query, countryName) {
    if (!query || !countryName) return false;
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedCountry = countryName.toLowerCase().trim();

    // Direct match check.
    if (normalizedCountry.includes(normalizedQuery)) {
      return true;
    }

    // Check aliases.
    const aliases = this.getAliases(normalizedCountry);
    for (const alias of aliases) {
      if (alias.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Given a user-typed query (e.g., "england"), returns the canonical country name (e.g., "united kingdom")
   * if the query matches one of the defined aliases, using both exact and (if necessary) partial matching.
   * If no match is found, returns the original query.
   * @param {String} query - The user input query.
   * @returns {String} - The canonical country name if found; otherwise, the original query.
   */
  getCanonicalName(query) {
    if (!query) return "";
    const normalizedQuery = query.toLowerCase().trim();

    // First, if the query itself is a canonical name, return it.
    if (this.aliases.hasOwnProperty(normalizedQuery)) {
      return normalizedQuery;
    }

    // Next, check for an exact match within the alias arrays.
    for (const [canonical, aliasArray] of Object.entries(this.aliases)) {
      if (aliasArray.some(alias => alias.toLowerCase().trim() === normalizedQuery)) {
        return canonical;
      }
    }

    // Fallback: If the query is longer than 2 characters, check for a partial match.
    if (normalizedQuery.length > 2) {
      for (const [canonical, aliasArray] of Object.entries(this.aliases)) {
        if (aliasArray.some(alias => alias.toLowerCase().includes(normalizedQuery))) {
          return canonical;
        }
      }
    }

    // No match found, return the original query.
    return query;
  }
}

//////////////////////////////
// CountryFacts Class
//////////////////////////////

class CountryFacts {
  constructor() {
    // A mapping of canonical country names (in lowercase) to their facts.
    // In a robust system, this might be loaded from an API or external data source.
    this.facts = {
      "united states": {
        independenceYear: 1776,
        motto: "In God We Trust",
        famousFor: "The Constitution, the Declaration of Independence",
        languages: ["English"],
        additionalInfo: "The United States is known for its diverse culture and innovation."
      },
      "united kingdom": {
        independenceYear: 1066, // or consider key historical dates (e.g., Magna Carta in 1215)
        motto: "Dieu et mon droit",
        famousFor: "Parliament, the Magna Carta, and its royal heritage",
        languages: ["English", "Welsh", "Scottish Gaelic"],
        additionalInfo: "The UK is known for its contributions to literature and science."
      },
      "france": {
        independenceYear: 843, // example historical date (Treaty of Verdun)
        motto: "Liberté, égalité, fraternité",
        famousFor: "Its art, cuisine, and revolution",
        languages: ["French"],
        additionalInfo: "France is a key center of European history and culture."
      },
      "germany": {
        independenceYear: 1871, // Formation of the German Empire
        motto: "Einigkeit und Recht und Freiheit (Unity and Justice and Freedom)",
        famousFor: "Its engineering, philosophy, and the Reformation",
        languages: ["German"],
        additionalInfo: "Germany is known for its rich history and modern economy."
      },
      "russia": {
        independenceYear: 1991, // Modern Russia formation
        motto: "Not applicable",  // Russia does not have an official motto in the same way
        famousFor: "Its literature, ballet, and historical influence",
        languages: ["Russian"],
        additionalInfo: "Russia is the largest country in the world by area."
      },
      "china": {
        independenceYear: "N/A", // As a unified republic or People's Republic?
        motto: "Serve the People", // One common phrase historically is "Serve the People"
        famousFor: "Its long history, the Great Wall, and economic growth",
        languages: ["Mandarin Chinese"],
        additionalInfo: "China is one of the world's oldest civilizations and has experienced rapid modernization."
      }
      // Additional country facts can be added here.
    };
  }

  /**
   * Retrieves historical and interesting facts for a given country.
   * @param {String} countryName - The country name to look up.
   * @returns {Object|null} - An object containing facts (or null if not found).
   */
  getFacts(countryName) {
    if (!countryName) return null;
    const normalized = countryName.toLowerCase().trim();
    return this.facts[normalized] || null;
  }
}

//////////////////////////////
// Module Export / Global Assignment
//////////////////////////////

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CountryAliases, CountryFacts };
} else {
  window.CountryAliases = CountryAliases;
  window.CountryFacts = CountryFacts;
} 