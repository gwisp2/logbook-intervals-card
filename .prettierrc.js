module.exports = {
    semi: true,
    importOrder: ["<THIRD_PARTY_MODULES>", "^[./]"],
    importOrderSeparation: true,
    importOrderParserPlugins: ['typescript', '["decorators", {"decoratorsBeforeExport": true}]'],
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 2,
};