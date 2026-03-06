Now I want to redesign the reason-json skill.

Basically, I want a unified schema, coming out from each _raw.txt file (example:output/2021011101404763/initial/QA20E21X99861-3D6_raw.txt), I want the skill to go over the raw file, and try to fill in the information using the raw file, to the schmea/unified_schema.json template. The output should be one row of record, follow exactly the unified schema json file. If nothing populated then we still output that json key but value is "".

In this case, the unified_schema.json needs to be redesigned. Should be something like below

{
    "通用":{
        "车辆名称":{
            "description":"描述本产品车辆的名称"，
            "keywords":"车辆基本信息.车辆名称, 车辆基本信息.车型名称, 车辆信息.车辆名称 "
        },
        "车辆型号":{
            ....
        }
    }
}

The description should describe what kind of semantic understanding should belong to this category.
The keywords add another helping layer for the reasoning step.

And the output json should be something like:

{
    "通用":{
        "车辆名称":"特斯拉"，
        "车辆型号":"TSL7000BEVBA3"
    }
    ....
}

each raw file should have the same format output json. so in later phase we are easy to merge to everything together.

For a single raw file, if multiple values exist for a same column, use / to separate them, make sure if this multiple value exist in multiple columns, then keep the sequence sync.

I think you could start by redesigning the unified_schema.json, then redesign the skill called reason-text-unified-schema. You could also write python tools for this skill if needed.