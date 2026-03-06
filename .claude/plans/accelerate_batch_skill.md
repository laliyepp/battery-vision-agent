I want to accelarate the chain-extract-batch skill. This is what I planned to do.

1. Step 1 is actually a standalone step that could do in parallel with rest of the step.

2. Step 2 remain unchange.

3. Step 3 remain unchange.

4. Step 4 remain unchange.

5. Step 5, you could build a reasoning prompt together with all the information (different sections, unified_schema_v2), and write a python tool to call the same model you are using but use API to batch-process each _raw.txt file into a _unified_output.json, you need to make sure this reasoning generate the same result as your own reasoning so you need to use the /home/laliyepp/dev/battery-vision-agent/output/test to do a A/B test, cc is your raw and result, api only contains raw.

You could call the individual level skill 'reason-text-unified-schema-api', and change the 'reason-text-unified-schema-batch' skill to accept another arg that pick from 'reason-text-unified-schema' or 'reason-text-unified-schema-api'

6. Step 6 remains unchange