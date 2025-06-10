import * as fs from "node:fs"
import * as path from "node:path"
import * as XLSX from "xlsx"

interface LMSDataPoint {
    day: number
    L: number
    M: number
    S: number
}

type ChartGenderData = {
    boys: LMSDataPoint[]
    girls: LMSDataPoint[]
}

// Fix for @typescript-eslint/no-empty-object-type
// Change from interface to type alias directly extending Record
type GrowthChartData = Record<string, ChartGenderData>

const dataDir = path.resolve(__dirname, "./")

async function parseAllGrowthData(): Promise<GrowthChartData> {
    const allData: GrowthChartData = {}
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".xlsx"))

    for (const file of files) {
        const filePath = path.join(dataDir, file)
        // Correcting unicode for emojis: 🔍
        console.log(`\u{1F50E} Parsing: ${file}`)

        let workbook: XLSX.WorkBook
        try {
            workbook = XLSX.readFile(filePath)
        } catch (error) {
            // Correcting unicode for emojis: ❌
            console.error(
                `\u{274C} Failed to read file: ${file}. Error: ${error instanceof Error ? error.message : String(error)}`
            )
            continue
        }

        const sheetName = workbook.SheetNames[0]

        if (!sheetName || !workbook.Sheets[sheetName]) {
            // Correcting unicode for emojis: ⚠️
            console.warn(`\u{26A0}\u{FE0F} No valid sheet found in file: ${file}`)
            continue // Skip this file
        }

        const worksheet = workbook.Sheets[sheetName]
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1
        })

        if (rawData.length === 0) {
            // Correcting unicode for emojis: ⚠️
            console.warn(`\u{26A0}\u{FE0F} Empty or invalid file: ${file}`)
            continue
        }

        let headerRowIndex = -1
        let dayCol = -1,
            lCol = -1,
            mCol = -1,
            sCol = -1

        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i]
            if (!Array.isArray(row)) continue

            // Helper function to safely get string from cell
            const getCellStringValue = (cell: unknown): string | undefined => {
                if (typeof cell === "string") return cell.trim().toLowerCase()
                if (typeof cell === "number") return String(cell).trim().toLowerCase()
                // We could handle dates or other specific types here if needed
                return undefined // Not a string or number, won't match
            }

            dayCol = row.findIndex((cell) => getCellStringValue(cell) === "day")
            lCol = row.findIndex((cell) => getCellStringValue(cell) === "l")
            mCol = row.findIndex((cell) => getCellStringValue(cell) === "m")
            sCol = row.findIndex((cell) => getCellStringValue(cell) === "s")

            if (dayCol >= 0 && lCol >= 0 && mCol >= 0 && sCol >= 0) {
                headerRowIndex = i
                break
            }
        }

        if (headerRowIndex === -1) {
            // Correcting unicode for emojis: ❌
            console.error(`\u{274C} Missing headers (Day, L, M, S) in: ${file}`)
            continue
        }

        const dataRows = rawData.slice(headerRowIndex + 1)

        const parsedData: LMSDataPoint[] = []
        for (const row of dataRows) {
            if (!Array.isArray(row)) continue

            // Helper function to safely parse number from cell
            const parseNumberFromCell = (cell: unknown): number => {
                if (typeof cell === "string") return Number(cell)
                if (typeof cell === "number") return cell
                // For other types, consider them non-numeric or log a warning
                return NaN // If it's not a string or number, it's not a valid number for us
            }

            const day = parseNumberFromCell(row[dayCol])
            const L = parseNumberFromCell(row[lCol])
            const M = parseNumberFromCell(row[mCol])
            const S = parseNumberFromCell(row[sCol])

            if ([day, L, M, S].every((v) => !Number.isNaN(v) && Number.isFinite(v))) {
                parsedData.push({ day, L, M, S })
            }
        }

        const fileNameParts = file.toLowerCase().replace(".xlsx", "").split("-")

        const chartType = fileNameParts[0]
        const gender = fileNameParts[1]

        if (!chartType || !gender || !["boys", "girls"].includes(gender)) {
            // Correcting unicode for emojis: ⚠️
            console.warn(
                `\u{26A0}\u{FE0F} Could not determine chart type or gender from filename "${file}". Expected format: type-gender.xlsx`
            )
            continue
        }

        allData[chartType] ??= { boys: [], girls: [] }
        allData[chartType][gender as "boys" | "girls"] = parsedData
    }

    return allData
}

void (async () => {
    try {
        const data = await parseAllGrowthData()
        const outputPath = path.resolve(__dirname, "growthData.json")
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
        // Correcting unicode for emojis: ✅
        console.log(`\u{2705} growthData.json saved to ${outputPath}`)
    } catch (err) {
        // Correcting unicode for emojis: ❌
        console.error(`\u{274C} Error parsing growth data:`, err)
    }
})()
