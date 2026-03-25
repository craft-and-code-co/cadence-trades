import { useState } from 'react'
import Papa from 'papaparse'
import { autoMapColumns, csvJobImporter } from '@/lib/importers/csv-importer'
import type { NormalizedJob, NormalizedCustomer, NormalizedService, ValidationIssue } from '@/lib/importers/types'
import type { CsvImportType } from '@/lib/importers/import-types'

export type CsvImportStep = 'upload' | 'mapping' | 'validation' | 'summary' | 'confirmation'

export interface CsvImportState {
  step: CsvImportStep
  importType: CsvImportType
  file: File | null
  rawData: Record<string, string>[]
  headers: string[]
  columnMapping: Record<string, string>
  normalizedJobs: NormalizedJob[]
  normalizedCustomers: NormalizedCustomer[]
  normalizedServices: NormalizedService[]
  issues: ValidationIssue[]
  importedCount: number
}

const INITIAL_STATE: CsvImportState = {
  step: 'upload',
  importType: 'jobs',
  file: null,
  rawData: [],
  headers: [],
  columnMapping: {},
  normalizedJobs: [],
  normalizedCustomers: [],
  normalizedServices: [],
  issues: [],
  importedCount: 0,
}

export function useCsvImport() {
  const [state, setState] = useState<CsvImportState>(INITIAL_STATE)

  const setStep = (step: CsvImportStep) => setState((s) => ({ ...s, step }))

  const setImportType = (importType: CsvImportType) =>
    setState((s) => ({ ...s, importType }))

  const parseFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || []
        const mapping = autoMapColumns(headers)
        setState((s) => ({
          ...s,
          file,
          rawData: result.data,
          headers,
          columnMapping: mapping,
          step: 'mapping',
        }))
      },
      error: () => {
        setState((s) => ({ ...s, file: null }))
      },
    })
  }

  const updateMapping = (csvColumn: string, targetField: string) => {
    setState((s) => {
      const next = { ...s.columnMapping }
      if (targetField === '') {
        delete next[csvColumn]
      } else {
        for (const key of Object.keys(next)) {
          if (next[key] === targetField && key !== csvColumn) {
            delete next[key]
          }
        }
        next[csvColumn] = targetField
      }
      return { ...s, columnMapping: next }
    })
  }

  const applyMappingAndValidate = () => {
    const mapped = state.rawData.map((row) => {
      const out: Record<string, string> = {}
      for (const [csvCol, targetField] of Object.entries(state.columnMapping)) {
        out[targetField] = row[csvCol] || ''
      }
      return out
    })

    if (state.importType === 'jobs') {
      const normalized = csvJobImporter.normalizeJobs(mapped)
      const issues = csvJobImporter.validate(normalized)
      setState((s) => ({ ...s, normalizedJobs: normalized, issues, step: 'validation' }))
    } else if (state.importType === 'customers') {
      const normalized = csvJobImporter.normalizeCustomers!(mapped)
      // Basic validation: name required
      const issues: ValidationIssue[] = normalized
        .map((c, i) => (!c.name ? { row: i + 2, field: 'name', message: 'Missing customer name', severity: 'error' as const } : null))
        .filter(Boolean) as ValidationIssue[]
      setState((s) => ({ ...s, normalizedCustomers: normalized, issues, step: 'validation' }))
    } else {
      const normalized = csvJobImporter.normalizeServices!(mapped)
      const issues: ValidationIssue[] = normalized
        .map((s, i) => (!s.service_name ? { row: i + 2, field: 'service_name', message: 'Missing service name', severity: 'error' as const } : null))
        .filter(Boolean) as ValidationIssue[]
      setState((s) => ({ ...s, normalizedServices: normalized, issues, step: 'validation' }))
    }
  }

  const setImportedCount = (count: number) =>
    setState((s) => ({ ...s, importedCount: count, step: 'confirmation' }))

  const reset = () => setState(INITIAL_STATE)

  return {
    state,
    setStep,
    setImportType,
    parseFile,
    updateMapping,
    applyMappingAndValidate,
    setImportedCount,
    reset,
  }
}
