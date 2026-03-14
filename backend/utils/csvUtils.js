const jsonToCsv = (json, fields) => {
    const csvRows = [];

    // Add header
    csvRows.push(fields.join(','));

    // Add rows
    for (const row of json) {
        const values = fields.map(field => {
            const val = row[field];
            const escaped = ('' + val).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

module.exports = { jsonToCsv };
