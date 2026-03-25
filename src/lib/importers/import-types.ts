export type CsvImportType = 'jobs' | 'customers' | 'pricebook'

export const IMPORT_TYPE_OPTIONS: { value: CsvImportType; label: string; description: string; template: string }[] = [
  {
    value: 'jobs',
    label: 'Job History',
    description: 'Service calls, invoices, and completed work',
    template: 'job-history-template.csv',
  },
  {
    value: 'customers',
    label: 'Customer List',
    description: 'Customer names, locations, and spend history',
    template: 'customer-list-template.csv',
  },
  {
    value: 'pricebook',
    label: 'Price Book',
    description: 'Services, rates, and estimated labor',
    template: 'price-book-template.csv',
  },
]

export const TARGET_FIELDS_BY_TYPE: Record<CsvImportType, { value: string; label: string }[]> = {
  jobs: [
    { value: '', label: '— Skip this column —' },
    { value: 'external_id', label: 'External ID / Invoice #' },
    { value: 'job_date', label: 'Job Date' },
    { value: 'service_name', label: 'Service Name' },
    { value: 'technician_name', label: 'Technician Name' },
    { value: 'hours_on_job', label: 'Hours' },
    { value: 'total_revenue', label: 'Revenue' },
    { value: 'lead_source', label: 'Lead Source' },
    { value: 'customer_name', label: 'Customer Name' },
    { value: 'customer_zip', label: 'Customer ZIP' },
  ],
  customers: [
    { value: '', label: '— Skip this column —' },
    { value: 'name', label: 'Customer Name' },
    { value: 'zip', label: 'ZIP Code' },
    { value: 'first_job_date', label: 'First Job Date' },
    { value: 'last_job_date', label: 'Last Job Date' },
    { value: 'total_spend', label: 'Total Spend' },
  ],
  pricebook: [
    { value: '', label: '— Skip this column —' },
    { value: 'service_name', label: 'Service Name' },
    { value: 'category', label: 'Category' },
    { value: 'flat_rate_price', label: 'Flat Rate Price' },
    { value: 'estimated_hours', label: 'Estimated Hours' },
    { value: 'parts_cost_estimate', label: 'Parts Cost Estimate' },
  ],
}

/** Required fields that must be mapped to continue */
export const REQUIRED_FIELDS_BY_TYPE: Record<CsvImportType, string[]> = {
  jobs: ['job_date', 'total_revenue'],
  customers: ['name'],
  pricebook: ['service_name'],
}
