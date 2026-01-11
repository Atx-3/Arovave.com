/**
 * Format price to always include $ sign
 * Handles both old format (100/kg) and new format ($100/kg)
 */
export function formatPrice(priceRange: string | undefined): string {
    if (!priceRange || priceRange.trim() === '') {
        return '';
    }

    // If already starts with $, return as is
    if (priceRange.startsWith('$')) {
        return priceRange;
    }

    // Add $ prefix
    return `$${priceRange}`;
}
