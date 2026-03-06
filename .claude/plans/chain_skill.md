Now, I want to build a skill that could chain these 5 skills together

Step 1: /parse-params <root_excel> <output_dir>
  → 三电参数.json (电池/电机/电控 parameters from root Excel)

Step 2: /build-manifest <test_plan_xls> <report_dir> <output_dir>
  → vision_manifest.json (PDFs to process)

Step 3: /vision-extract <vision_manifest.json>
  → {report_id}_raw.txt (per PDF, parallel Vision API extraction)

Step 4: /build-reason-manifest <output_dir>
  → reason_manifest.json

Step 5: /reason-json <reason_manifest.json>
  → {report_id}_reasoning_output.json (per PDF, structured 电池/电机/电控 key-value pairs)


several separate parmeters to provide for the skill

Step 1: {root_excel},{output_dir}
Step 2: {test_plan_xls},{report_dir},{output_dir}/{subfolder}
Step 3: {output_dir}/{subfolder}/vision_manifest.json
Step 4: {output_dir}/{subfolder}
Step 5: {output_dir}/{subfolder}/reason_manifest.json

So these 5 skills can be chained and invoke by the skill we build, maybe need to change the model invocation parameter