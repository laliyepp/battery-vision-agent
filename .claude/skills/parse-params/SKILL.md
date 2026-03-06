---
name: parse-params
description: Parse a root-level Excel file and extract battery/motor/econtrol parameters into a clean JSON.
argument-hint: <excel_path> <output_dir>
---

# Parse Params

Read a root-level Excel file, reason through its content, and extract all information related to 车辆名称，车辆型号，生产厂商，电池 (battery), 电机 (motor), and 电控 (electronic control) into a structured JSON.

## Arguments

- `$0` — Path to the Excel file (.xlsx or .xls)
- `$1` — Path to the output directory

## Process

1. Read the Excel file content. Use whatever tool works best (Read, Bash, etc.).
2. Identify all parameters related to 车辆名称，车辆型号，生产厂商，电池/电机/电控.
3. Organize into a clean JSON with meaningful Chinese keys. Include units where present. Omit structural metadata (序号, row numbers, column indices).
4. Write the JSON to `$1/三电参数.json`.

## Rules

- Keys must be meaningful and readable
- Include units in keys where applicable (e.g., `额定电压_V`)
- Group related parameters logically
- Omit anything not related to 电池/电机/电控
- Omit structural/formatting metadata from the source file
