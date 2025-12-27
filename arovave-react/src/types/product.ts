export interface ProductSpec {
    label: string;
    value: string;
}

export interface Product {
    id: number;
    name: string;
    cat: string;
    subcategory?: string;
    images: string[];
    video?: string;
    description: string;
    specs: ProductSpec[];
    moq: string;
    priceRange: string;
    isTrending?: boolean;
    hsn: string;
    certifications: string[];
    // New fields for enhanced product info
    leadTime?: string;          // e.g., "15-30 Days"
    material?: string;          // Material or formulation
    packagingOptions?: string;  // Available packaging options
}
