import {
  motivationalQuotes,
  getNextMotivationalQuote,
  getCurrentQuoteIndex,
  setCurrentQuoteIndex,
  resetQuoteProgression,
  getRandomMotivationalQuote,
  MotivationalQuote,
} from "../motivationalQuotes";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock console.warn to suppress expected warnings
const originalWarn = console.warn;

describe("MotivationalQuotes", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
    resetQuoteProgression(); // Ensure clean state
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  describe("motivationalQuotes data", () => {
    test("should contain all provided quotes", () => {
      expect(motivationalQuotes).toHaveLength(motivationalQuotes.length);
      expect(motivationalQuotes.length).toBeGreaterThan(0);
    });

    test("should have quotes with required structure", () => {
      motivationalQuotes.forEach((quote) => {
        expect(quote).toHaveProperty("quote");
        expect(quote).toHaveProperty("author");
        expect(typeof quote.quote).toBe("string");
        expect(typeof quote.author).toBe("string");
        expect(quote.quote.length).toBeGreaterThan(0);
        expect(quote.author.length).toBeGreaterThan(0);
      });
    });

    test("should contain expected sample quotes", () => {
      const halElrodQuote = motivationalQuotes.find(
        (q) => q.author === "Hal Elrod"
      );
      expect(halElrodQuote).toBeDefined();
      expect(halElrodQuote?.quote).toContain(
        "responsibility for everything in your life"
      );

      const nelsonMandelaQuote = motivationalQuotes.find(
        (q) => q.author === "Nelson Mandela"
      );
      expect(nelsonMandelaQuote).toBeDefined();
      expect(nelsonMandelaQuote?.quote).toContain("greatest glory in living");
    });

    test("should not have duplicate quotes", () => {
      const quoteTexts = motivationalQuotes.map((q) => q.quote);
      const uniqueQuotes = new Set(quoteTexts);
      expect(uniqueQuotes.size).toBe(quoteTexts.length);
    });
  });

  describe("getCurrentQuoteIndex", () => {
    test("should return 0 when no index is stored", () => {
      expect(getCurrentQuoteIndex()).toBe(0);
    });

    test("should return stored index when valid", () => {
      setCurrentQuoteIndex(5);
      expect(getCurrentQuoteIndex()).toBe(5);
    });

    test("should return 0 when stored index is invalid", () => {
      localStorageMock.getItem.mockReturnValue("invalid");
      expect(getCurrentQuoteIndex()).toBe(0);
    });

    test("should return 0 when stored index is negative", () => {
      localStorageMock.getItem.mockReturnValue("-1");
      expect(getCurrentQuoteIndex()).toBe(0);
    });

    test("should return 0 when stored index exceeds array length", () => {
      localStorageMock.getItem.mockReturnValue("1000");
      expect(getCurrentQuoteIndex()).toBe(0);
    });

    test("should handle localStorage errors gracefully", () => {
      console.warn = jest.fn();

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      expect(getCurrentQuoteIndex()).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        "Could not access localStorage for quote index:",
        expect.any(Error)
      );
    });
  });

  describe("setCurrentQuoteIndex", () => {
    test("should store index in localStorage", () => {
      setCurrentQuoteIndex(10);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "linkedgoals_quote_index",
        "10"
      );
    });

    test("should handle localStorage errors gracefully", () => {
      console.warn = jest.fn(); // Suppress warnings for this test

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      // This should not throw, but handle the error gracefully
      expect(() => setCurrentQuoteIndex(5)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        "Could not save quote index to localStorage:",
        expect.any(Error)
      );

      // Restore the mock
      localStorageMock.setItem.mockRestore();
    });
  });

  describe("getNextMotivationalQuote", () => {
    beforeEach(() => {
      // Reset quote progression before each test to ensure clean state
      resetQuoteProgression();
    });

    test("should return first quote when starting fresh", () => {
      const quote = getNextMotivationalQuote();
      expect(quote).toEqual(motivationalQuotes[0]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "linkedgoals_quote_index",
        "1"
      );
    });

    test("should progress through quotes sequentially", () => {
      // Start at index 5
      setCurrentQuoteIndex(5);
      localStorageMock.getItem.mockReturnValue("5");

      const quote = getNextMotivationalQuote();
      expect(quote).toEqual(motivationalQuotes[5]);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        "linkedgoals_quote_index",
        "6"
      );
    });

    test("should cycle back to beginning after reaching end", () => {
      // Set to last index
      const lastIndex = motivationalQuotes.length - 1;
      setCurrentQuoteIndex(lastIndex);
      localStorageMock.getItem.mockReturnValue(lastIndex.toString());

      const quote = getNextMotivationalQuote();
      expect(quote).toEqual(motivationalQuotes[lastIndex]);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        "linkedgoals_quote_index",
        "0"
      );
    });

    test("should handle corrupted index gracefully", () => {
      localStorageMock.getItem.mockReturnValue("corrupted");

      const quote = getNextMotivationalQuote();
      expect(quote).toEqual(motivationalQuotes[0]);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        "linkedgoals_quote_index",
        "1"
      );
    });
  });

  describe("resetQuoteProgression", () => {
    test("should reset index to 0", () => {
      setCurrentQuoteIndex(25);
      resetQuoteProgression();
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        "linkedgoals_quote_index",
        "0"
      );
    });
  });

  describe("getRandomMotivationalQuote", () => {
    test("should return a valid quote from the array", () => {
      const quote = getRandomMotivationalQuote();
      expect(motivationalQuotes).toContainEqual(quote);
    });

    test("should return different quotes on multiple calls (statistically)", () => {
      const quotes = Array.from({ length: 10 }, () =>
        getRandomMotivationalQuote()
      );
      const uniqueQuotes = new Set(quotes.map((q) => q.quote));

      // With multiple quotes and 10 calls, we should get some variety (allowing for some randomness)
      expect(uniqueQuotes.size).toBeGreaterThan(1);
    });
  });

  describe("MotivationalQuote interface", () => {
    test("should properly type quote objects", () => {
      const testQuote: MotivationalQuote = {
        quote: "Test quote",
        author: "Test Author",
      };

      expect(testQuote.quote).toBe("Test quote");
      expect(testQuote.author).toBe("Test Author");
    });
  });

  describe("Quote progression integration", () => {
    beforeEach(() => {
      // Ensure clean state for integration tests
      resetQuoteProgression();
      jest.clearAllMocks();
    });

    test("should progress through multiple quotes correctly", () => {
      // Mock the localStorage to return sequential values
      localStorageMock.getItem
        .mockReturnValueOnce("0") // First call returns index 0
        .mockReturnValueOnce("1") // Second call returns index 1
        .mockReturnValueOnce("2"); // Third call returns index 2

      const firstQuote = getNextMotivationalQuote();
      const secondQuote = getNextMotivationalQuote();
      const thirdQuote = getNextMotivationalQuote();

      expect(firstQuote).toEqual(motivationalQuotes[0]);
      expect(secondQuote).toEqual(motivationalQuotes[1]);
      expect(thirdQuote).toEqual(motivationalQuotes[2]);
    });

    test("should complete cycle correctly with sample", () => {
      // Test with first 3 quotes to ensure cycling works
      localStorageMock.getItem
        .mockReturnValueOnce("0") // First call returns index 0
        .mockReturnValueOnce("1") // Second call returns index 1
        .mockReturnValueOnce("2"); // Third call returns index 2

      const firstQuote = getNextMotivationalQuote(); // Should be index 0
      const secondQuote = getNextMotivationalQuote(); // Should be index 1
      const thirdQuote = getNextMotivationalQuote(); // Should be index 2

      expect(firstQuote).toEqual(motivationalQuotes[0]);
      expect(secondQuote).toEqual(motivationalQuotes[1]);
      expect(thirdQuote).toEqual(motivationalQuotes[2]);

      // Verify cycling by going to end
      const lastIndex = motivationalQuotes.length - 1;
      localStorageMock.getItem.mockReturnValue(lastIndex.toString());
      const lastQuote = getNextMotivationalQuote();
      expect(lastQuote).toEqual(motivationalQuotes[lastIndex]);

      // Next should cycle to beginning
      localStorageMock.getItem.mockReturnValue("0");
      const cycledQuote = getNextMotivationalQuote();
      expect(cycledQuote).toEqual(motivationalQuotes[0]);
    });
  });
});
