import { useCallback, useRef, useState } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import { IMPORT_TYPE_OPTIONS, type CsvImportType } from '@/lib/importers/import-types'

interface Props {
  importType: CsvImportType
  onTypeChange: (type: CsvImportType) => void
  onFileParsed: (file: File) => void
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function CsvUploadStep({ importType, onTypeChange, onFileParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(
    (file: File) => {
      setError('')
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a .csv file.')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('File is too large. Maximum size is 10MB.')
        return
      }
      onFileParsed(file)
    },
    [onFileParsed]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const selectedTemplate = IMPORT_TYPE_OPTIONS.find((t) => t.value === importType)

  return (
    <div className="space-y-6">
      {/* Import type selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-on-surface">What are you importing?</p>
        <div className="grid grid-cols-3 gap-2">
          {IMPORT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTypeChange(opt.value)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                importType === opt.value
                  ? 'border-primary bg-primary/10 text-on-surface'
                  : 'border-outline-variant/20 bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Download template */}
      {selectedTemplate && (
        <a
          href={`/templates/${selectedTemplate.template}`}
          download
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Download className="h-3.5 w-3.5" />
          Download {selectedTemplate.label} template
        </a>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary bg-primary/10'
            : 'border-outline-variant/20 bg-surface-container hover:bg-surface-container-high'
        }`}
      >
        {dragActive ? (
          <FileText className="h-10 w-10 text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-on-surface-variant" />
        )}
        <div className="text-center">
          <p className="font-medium text-on-surface">
            {dragActive ? 'Drop your file here' : 'Drag & drop your CSV file'}
          </p>
          <p className="text-sm text-on-surface-variant">or click to browse (max 10MB)</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
