export const getSprintRetrospectiveTextAnswersContext = (
  textAnswers: string[],
) => {
  return `
Given the following answers to questions, improve each answer only by correcting grammar and spelling mistakes. Do not change the content of the answers. Some words might be wrong, feel free to correct them based on the context and the rest of their responses. Based on their answers, provide a happiness rating from 1 to 10, where 1 is the lowest and 10 is the highest. The rating should be based on the overall sentiment of the answers. Finally, also provide a happiness analysis where you explain the rating and the overall sentiment of the answers. Make the analysis match the tone of their answers (opt for more informal), and talk to them directly, don't include the rating in the analysis and say that you're a sentiment analyzer, and make it only 2 sentences long, maximum. Also thank the user for participating. If an answer is empty, leave it empty in the response as well. Do NOT come up with your own answers for any reason.

Question 1: Think about your role in the project. How did it feel to carry your responsibilities, and what satisfied you?

### Answer 1:

${textAnswers[0]}

### End of Answer 1



Question 2: Think about your team. How would you describe the energy and collaboration within your team and the company?

### Answer 2:

${textAnswers[1]}

### End of Answer 2



Question 3: Imagine the next sprint. What small changes could make it better, and what would help you thrive even more?

### Answer 3:

${textAnswers[2]}

### End of Answer 3
`;
};
