const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `      {result && !scanning && (`;
const startIndex = content.indexOf(`      {result && !scanning && (`);
const endBoundaryIndex = content.indexOf(`function AIAssistant`);
const endStr = `        </motion.div>\n      )}`;
const endOffset = content.lastIndexOf(endStr, endBoundaryIndex);

if (startIndex !== -1 && endOffset !== -1) {
    let block = content.substring(startIndex, endOffset);
    console.log("Found block of length:", block.length);

    block = block.replace(/\{result && !scanning && \(/g, `      {result && !scanning && (Array.isArray(result) ? result : [result]).map((resItem: any, index: number) => (`);

    // Replace result.property with resItem.property
    block = block.replace(/result\.verdict/g, "resItem.verdict");
    block = block.replace(/result\.type/g, "resItem.type");
    block = block.replace(/result\.found/g, "resItem.found");
    block = block.replace(/result\.riskScore/g, "resItem.riskScore");
    block = block.replace(/result\.analysis/g, "resItem.analysis");
    block = block.replace(/result\.redFlags/g, "resItem.redFlags");
    block = block.replace(/result\.candidates/g, "resItem.candidates");
    block = block.replace(/result\.leakages/g, "resItem.leakages");
    block = block.replace(/result\.websites/g, "resItem.websites");

    block = block.replace(/<motion.div \n          initial=/g, `<motion.div \n          key={index}\n          initial=`);
    block = block.replace(/className=\{cn\(\n            "glass-card p-6 border-l-4",/g, `className={cn(\n            "glass-card p-6 border-l-4 mb-4",`);

    block += `        </motion.div>\n      ))}`;

    // Add title for multiple results
    block = block.replace(/<div className="flex items-start gap-4 flex-col md:flex-row">/g, `{Array.isArray(result) && <h3 className="font-bold text-lg mb-4 opacity-80 border-b border-border pb-2">Results for: {resItem.input || 'Unknown'}</h3>}\n          <div className="flex items-start gap-4 flex-col md:flex-row">`);

    const endStr = `        </motion.div>\n      )}`;
    const newContent = content.substring(0, startIndex) + block + content.substring(endOffset + endStr.length);

    fs.writeFileSync('src/App.tsx', newContent);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find boundaries.");
}
