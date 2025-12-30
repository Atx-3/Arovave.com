// Country data with dial codes
export const countryData = [
    { name: 'India', code: '+91' },
    { name: 'United States', code: '+1' },
    { name: 'United Kingdom', code: '+44' },
    { name: 'Germany', code: '+49' },
    { name: 'France', code: '+33' },
    { name: 'Japan', code: '+81' },
    { name: 'Australia', code: '+61' },
    { name: 'Canada', code: '+1' },
    { name: 'Brazil', code: '+55' },
    { name: 'Mexico', code: '+52' },
    { name: 'UAE', code: '+971' },
    { name: 'Saudi Arabia', code: '+966' },
    { name: 'South Africa', code: '+27' },
    { name: 'Singapore', code: '+65' },
    { name: 'Malaysia', code: '+60' },
    { name: 'Indonesia', code: '+62' },
    { name: 'Thailand', code: '+66' },
    { name: 'Vietnam', code: '+84' },
    { name: 'Philippines', code: '+63' },
    { name: 'Nigeria', code: '+234' },
    { name: 'Kenya', code: '+254' },
    { name: 'Egypt', code: '+20' },
    { name: 'Turkey', code: '+90' },
    { name: 'Poland', code: '+48' },
    { name: 'Netherlands', code: '+31' },
    { name: 'Belgium', code: '+32' },
    { name: 'Other', code: '' }
];

// Export just country names for backward compatibility
export const countries = countryData.map(c => c.name);

// Helper function to get country code
export const getCountryCode = (countryName: string): string => {
    const country = countryData.find(c => c.name === countryName);
    return country?.code || '';
};
