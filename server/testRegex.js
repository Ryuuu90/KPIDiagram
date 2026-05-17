const formula = "EC062 - EC003";
const matches = formula.match(/EC[A-Za-z0-9_]+|R[A-Za-z0-9_]+/gi) || [];
const childrenIds = [...new Set(matches.map(id => id.toUpperCase()))];
console.log('Resulting childrenIds:', childrenIds);
process.exit(0);
