import {
  useLoopingSuggestions,
  useMarketsSuggestions,
  useVaultSuggestions,
} from "@/hooks";
import { SuggestionsWrapper } from "@/types";

const useSuggestions = (): SuggestionsWrapper[] => {
  const vaultSuggestionsWrappers = useVaultSuggestions();
  const marketSuggestionsWrappers = useMarketsSuggestions();
  const loopingSuggestionsWrappers = useLoopingSuggestions();

  const wrappersArray = [
    vaultSuggestionsWrappers,
    marketSuggestionsWrappers,
    loopingSuggestionsWrappers,
  ];
  const mergedWrappers: Record<string, SuggestionsWrapper> = {};

  wrappersArray.forEach((wrapperRecord) => {
    Object.values(wrapperRecord).forEach((wrapper) => {
      const tokenAddress = wrapper.token.address;

      if (!mergedWrappers[tokenAddress]) {
        mergedWrappers[tokenAddress] = {
          ...wrapper,
          suggestions: [...wrapper.suggestions],
        };
      } else {
        mergedWrappers[tokenAddress].suggestions = [
          ...mergedWrappers[tokenAddress].suggestions,
          ...wrapper.suggestions,
        ];
      }
    });
  });

  const mergedArray = Object.values(mergedWrappers).map((wrapper) => {
    const sortedSuggestions = [...wrapper.suggestions].sort(
      (a, b) => b.aprOrApy - a.aprOrApy
    );

    return {
      ...wrapper,
      suggestions: sortedSuggestions,
    };
  });

  mergedArray.sort((a, b) => {
    const aTopApr = a.suggestions[0]?.aprOrApy || 0;
    const bTopApr = b.suggestions[0]?.aprOrApy || 0;

    const aScore = aTopApr * a.usdValue;
    const bScore = bTopApr * b.usdValue;

    return bScore - aScore;
  });

  return mergedArray;
};

export { useSuggestions };
