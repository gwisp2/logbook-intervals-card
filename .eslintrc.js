module.exports = {
    parser: '@typescript-eslint/parser',  // Specifies the ESLint parser
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',  
        'plugin:prettier/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2018,  // Allows for the parsing of modern ECMAScript features
        sourceType: 'module',  // Allows for the use of imports
        experimentalDecorators: true,
    },
    rules: {
        "@typescript-eslint/naming-convention": ["warn",
            {
                selector: 'default',
                format: ['camelCase'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },

            {
                selector: 'variable',
                format: ['camelCase', 'UPPER_CASE'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },

            {
                selector: 'typeLike',
                format: ['PascalCase'],
            },
        ]
    }
};
