const text1 = "![Generated Image](https://image.pollinations.ai/prompt/A%20beautiful%20sunset?seed=42&width=1024&height=1024&nologo=true)";
const match1 = text1.match(/\!\[.*?\]\((.+)\)/);
console.log(match1 ? match1[1] : null);
