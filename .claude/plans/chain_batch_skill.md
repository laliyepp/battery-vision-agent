I want to build a chain to process one input folder by invoking a sequence of skills.

The Args:
    1. Root Excel to process
    2. vehicle input directory
    3. vehicle output directory

The sequence of skills:
    1. reason-excel-unified-schema arg1 arg2
    2. build-manifest-batch arg2 arg3
    3. vision-extract-batch arg3
    4. build-reason-manifest-batch arg3
    5. reason-text-unified-schema-batch arg3
    6. merge-unified-table arg3