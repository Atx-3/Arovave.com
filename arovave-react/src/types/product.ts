export interface ProductSpec {
    label: string;
    value: string;
}

// Custom key specification (admin can add multiple)
export interface KeySpec {
    key: string;
    value: string;
}

export interface Product {
    id: number;
    name: string;
    cat: string;
    subcategory?: string;
    images: string[];
    thumbnail?: string;           // Thumbnail image for grid view
    video?: string;
    description: string;
    specs: ProductSpec[];
    moq: string;
    priceRange: string;
    isTrending?: boolean;
    hsn: string;
    certifications: string[];
    // New fields for enhanced product info
    leadTime?: string;            // e.g., "15-30 Days"
    material?: string;            // Material or formulation
    packagingOptions?: string;    // Available packaging options
    // Tab contents
    tabDescription?: string;      // Content for Description tab
    tabSpecifications?: string;   // Content for Specifications tab
    tabAdvantage?: string;        // Content for Advantage tab
    tabBenefit?: string;          // Content for Benefit tab
    // Custom key specifications
    keySpecs?: KeySpec[];         // Custom key-value specifications from admin
}
