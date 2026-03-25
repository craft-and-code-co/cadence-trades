import { useNavigate } from 'react-router-dom'
import { useCsvImport } from '@/hooks/useCsvImport'
import { IMPORT_TYPE_OPTIONS } from '@/lib/importers/import-types'
import { CsvUploadStep } from '@/components/data/CsvUploadStep'
import { CsvMappingStep } from '@/components/data/CsvMappingStep'
import { CsvValidationStep } from '@/components/data/CsvValidationStep'
import { CsvSummaryStep } from '@/components/data/CsvSummaryStep'
import { CsvConfirmationStep } from '@/components/data/CsvConfirmationStep'

const STEP_LABELS = ['Upload', 'Map Columns', 'Validate', 'Review', 'Done']

export default function ImportCsv() {
  const navigate = useNavigate()
  const {
    state,
    setStep,
    setImportType,
    parseFile,
    updateMapping,
    applyMappingAndValidate,
    setImportedCount,
    reset,
  } = useCsvImport()

  const stepIndex = STEP_LABELS.indexOf(
    { upload: 'Upload', mapping: 'Map Columns', validation: 'Validate', summary: 'Review', confirmation: 'Done' }[state.step]
  )

  const typeLabel = IMPORT_TYPE_OPTIONS.find((t) => t.value === state.importType)?.label ?? 'Data'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{STEP_LABELS[stepIndex]}</span>
            <span>Step {stepIndex + 1} of {STEP_LABELS.length}</span>
          </div>
          <div className="flex gap-1.5">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {state.step === 'confirmation' ? 'Import Complete' : `Import ${typeLabel}`}
        </h1>

        {state.step === 'upload' && (
          <CsvUploadStep
            importType={state.importType}
            onTypeChange={setImportType}
            onFileParsed={parseFile}
          />
        )}

        {state.step === 'mapping' && (
          <CsvMappingStep
            importType={state.importType}
            headers={state.headers}
            rawData={state.rawData}
            columnMapping={state.columnMapping}
            onUpdateMapping={updateMapping}
            onConfirm={applyMappingAndValidate}
            onBack={() => setStep('upload')}
          />
        )}

        {state.step === 'validation' && (
          <CsvValidationStep
            totalRows={state.rawData.length}
            issues={state.issues}
            onContinue={() => setStep('summary')}
            onBack={() => setStep('mapping')}
          />
        )}

        {state.step === 'summary' && (
          <CsvSummaryStep
            importType={state.importType}
            file={state.file}
            jobs={state.normalizedJobs}
            customers={state.normalizedCustomers}
            services={state.normalizedServices}
            issues={state.issues}
            onImported={setImportedCount}
            onBack={() => setStep('validation')}
          />
        )}

        {state.step === 'confirmation' && (
          <CsvConfirmationStep
            importedCount={state.importedCount}
            onImportAnother={reset}
            onFinish={() => navigate('/')}
          />
        )}
      </div>
    </div>
  )
}
