// prettier.config.mjs

/**
 * @type {import('prettier').Config}
 */
export default {
    // Plugins for additional formatting capabilities
    plugins: [
        "prettier-plugin-tailwindcss",
        "prettier-plugin-organize-imports",
        "prettier-plugin-sh",
    ],

    // General formatting options
    tabWidth: 4,
    semi: true, // Always add semicolons
    singleQuote: true, // Use single quotes
    trailingComma: 'all', // Add trailing commas where valid

    // Overrides for specific file types
    overrides: [
        {
            files: ['.npmrc', '.env*'],
            options: {
                parser: 'sh',
            },
        },
    ],
};
