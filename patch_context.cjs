const fs = require('fs');

let content = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf8');

function replaceFirst(str, search, replacement) {
    const index = str.indexOf(search);
    if (index === -1) return str;
    return str.substring(0, index) + replacement + str.substring(index + search.length);
}

content = replaceFirst(content, "  commanderName: string;", "  commanderName: string;\n  commanderEmail: string;");
content = replaceFirst(content, "  setCommanderName: (name: string) => void;", "  setCommanderName: (name: string) => void;\n  setCommanderEmail: (email: string) => void;");
content = replaceFirst(content, "| 'setCommanderName'", "| 'setCommanderName' | 'setCommanderEmail'");
content = replaceFirst(content, "  commanderName: 'Commander',", "  commanderName: 'Commander',\n  commanderEmail: 'officialsomay222@gmail.com',");

fs.writeFileSync('src/contexts/SettingsContext.tsx', content);
