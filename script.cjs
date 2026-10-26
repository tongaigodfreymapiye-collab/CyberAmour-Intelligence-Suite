const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `      {result && !scanning && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "glass-card p-6 border-l-4",
            result.verdict === 'Safe' || (result.type === 'breach' && result.found?.length === 0) ? "border-l-success" : result.verdict === 'Suspicious' ? "border-l-[#F59E0B]" : "border-l-danger"
          )}
        >`;

const startIndex = content.indexOf(targetStr);
const endIndexStr = `        </motion.div>
      )}

    </motion.div>
  );
}`;

if (startIndex === -1) {
  console.log("Could not find start string.");
  process.exit(1);
}

const endOffset = content.indexOf(endIndexStr, startIndex) + endIndexStr.length - `\n    </motion.div>\n  );\n}`.length;

let block = content.substring(startIndex, endOffset);

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

block = block.replace(`        </motion.div>\n      )}`, `        </motion.div>\n      ))}`);

// Add title for multiple results
block = block.replace(/<div className="flex items-start gap-4 flex-col md:flex-row">/g, `{Array.isArray(result) && <h3 className="font-bold text-lg mb-4 opacity-80 border-b border-border pb-2">Results for: {resItem.input || 'Unknown'}</h3>}\n          <div className="flex items-start gap-4 flex-col md:flex-row">`);

content = content.substring(0, startIndex) + block + content.substring(endOffset);

fs.writeFileSync('src/App.tsx', content);
console.log("Replaced successfully!");
