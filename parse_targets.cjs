const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('/Users/andrew/.gemini/antigravity/brain/fb629c4a-24d0-4bac-a101-bfbba677559c/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.content) {
        const matches = obj.content.match(/\d+\.\s\[(BLOCKER|MAJOR|MINOR)\].*/g);
        if (matches) {
          fs.writeFileSync('targets.txt', matches.join('\n'));
          console.log(`Found ${matches.length} targets`);
          return;
        }
      }
    } catch(e) {}
  }
}

processLineByLine();
