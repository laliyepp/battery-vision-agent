Could you analyze this whole repo, and use the /pptx skill to generate a deck to show stakeholders/tech leads the design of the architect and the AI-native mindset behind this architecture? The audience is a senior tech lead/architect and a business stakeholder.

Could you make a plan first about the overall content you want to build?

-----
For slide 1: remove battery/CCC specific info, do not say powered by Claude, using more professional tone instead of looking like an ADs

Slide 2 looks good

Slide 3: Traditional part, more focus on the freeformat of each folder's structure, hard to build a deterministic workflow to go through everything with a predefined logic

For other architecture/techinical details, please limit them into 7 slides. 

1 slide for summary, do not need what's next

-----

Slide 1, you need to point out the whole pipeline is based on Claude Skills
Slide 2, emphasize the free format(I do not know if this is correct term, basically, each subfolder of a data point has some inconsistencies, hard to hardcode a solution)
Slide 3 AI-native part, capable to handle this "free-format", also is it called free-format?

slide 4 looks good
slide 5, descrpition and keywords are both for semantic understanding, also I do not know what is Schema embedded in API prompts at runtime/Triple duty: extraction target, validation contract, output template, I want a clearer expression

slide 6, Reasoning: use the CC native solution, not the API

remove slide 7

slide 8 looks good

slide 9, I want you to move this in earlier slides, basically, express more clear about how we build atomic skills/batch skills/chain skills, and use CC mode as default

slide 10, only talk about output and your own agent validation, do not tablk about .py and history pipelines

slide 11, resummary with above changes.