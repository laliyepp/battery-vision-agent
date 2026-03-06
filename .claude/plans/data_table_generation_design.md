Now I want you to build another skill to build tabular data table, partitioned by application_date(送样日期), signoff_date(签发日期) and change_status(initial/change1/change2...,this change_status is just which sub_folder the file is in), and separated into 3 tables: 电池(battery), 电机(motor), 电控(electronic control). Basically, I want the skill to be able to

1. search through a folder and its subfolder for all files ends with _reasoning_output.json, then ordered these files by their change_status ascend, then signoff_date(签发日期) ascend, then application_date(送样日期) ascend
2. Classify each file's data into 电池/电机/电控 categories using semantic reasoning
3. Start to build 3 data tables (one per category) following the order
    3.1. date pair and change_status are the partition, which means a date pair/change_status should only contains one line of record
    3.2. If one partition only have one file, then generate table headers and one row containing essential information of those headers, If one partition contains multiple files, then merge same information, if same header has 2 values for the same partition, then make it 2 headers with _1, _2, _3...
    3.3. once you go to another partition
        3.3.1. if a value shares the similar header like previous partition, then you just fill that header with new value.
        3.3.2. if no value showed for a existing header, leave it blank
        3.3.3. if more headers are found than before, add new headers to the data table and fill new value, old value is just keeping empty
        3.3.4. if you found _1，_2, _3 in headers that you need to change using existing value, create a new header _4 instead of changing the value.
4. After building the 3 data tables (broad tables), output them as a single Excel with 3 sheets: 电池, 电机, 电控.
