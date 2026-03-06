Now I have another type of data. Which is quite different from current agentic flow.

The data sample is @/home/laliyepp/dev/battery-vision-agent/data/raw_example/2020091101021431

I think the overall logic is that the subfolder /home/laliyepp/dev/battery-vision-agent/data/raw_example/2020091101021431/4-历次申请及变更 contains a lot of subfolder with 2019xxxxx and 2020xxxx, within those folders, there are another 认证委托资料 folder, within that, there are 申请信息.pdf that records the application_date, and multiple 参数表附件整车参数_xxxxxx.xlsx. I want you to process these xlsx files just like reason-excel-unified-schema skill, with application_date using the 申请信息.pdf within that folder

I want you to decouple this process into multiple skills, follow the chain-extract-batch skill and its subskill design. Make up a plan.