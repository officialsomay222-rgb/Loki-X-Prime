const text1 = "Some intro <think>This is reasoning</think> and this is content";
const text2 = "Some intro <think>This is incomplete reasoning";
const text3 = "Just content";

const extractReasoning = (text: string): { content: string, reasoning: string } => {
  let reasoning = "";
  let content = text;

  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    content = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trimStart();
  } else {
    const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch) {
      reasoning = thoughtMatch[1].trim();
      content = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trimStart();
    } else {
      const openThinkMatch = text.match(/<think>([\s\S]*)$/i);
      if (openThinkMatch) {
         reasoning = openThinkMatch[1].trim();
         content = text.replace(/<think>[\s\S]*$/gi, '').trimStart();
      } else {
         const openThoughtMatch = text.match(/<thought>([\s\S]*)$/i);
         if (openThoughtMatch) {
           reasoning = openThoughtMatch[1].trim();
           content = text.replace(/<thought>[\s\S]*$/gi, '').trimStart();
         }
      }
    }
  }
  return { content, reasoning };
};

console.log(extractReasoning(text1));
console.log(extractReasoning(text2));
console.log(extractReasoning(text3));
