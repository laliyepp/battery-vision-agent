I want to build another 3 skills that could automatically trigger the reason-excel-unified-schema inside the chain-extract-batch

- you need to adjust the reason-excel-unified-schema to use xlsx/ skill to understand the excel sheet.
- 1st new skill should take the vehicle input folder as input, then go through the 结构参数 folder ONLY (not taking other folders), to pick up every excel file and build a manifest.
- 2nd new skill should be picking up the manifest, and leverage the reason-excel-unified-schema to process each excel
- 3rd new skill should chain the first and 2nd skill together

- Last, update the chain-extract-batch skill Step 1, to invoke the 3rd new skill. this way, the whole chain-extract-batch only needs to take vehicle input/output and optional api/cc arguments