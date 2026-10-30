import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import CustomerTable from '../components/CustomerTable'
import CustomerForm from '../components/CustomerForm'
import ClientLinks from '../components/ClientLinks'
import logo from '../assets/surya-industries-logo.png'

function Dashboard() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const importInputRef = useRef(null)
  const [excelBusy, setExcelBusy] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('sr_no', { ascending: true })

    if (error) {
      console.error('Error loading customers:', error)
      alert(error.message)
    } else {
      setCustomers(data || [])
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const excelColumns = [
    { key: 'client_name', header: 'Client / Company Name' },
    { key: 'contact_person', header: 'Contact Person' },
    { key: 'contact_number', header: 'Contact Number' },
    { key: 'office_number', header: 'Office Number' },
    { key: 'designation', header: 'Post / Designation' },
    { key: 'email', header: 'Mail ID' },
    { key: 'category', header: 'Category / Details' },
    { key: 'remark', header: 'Remark' },
    { key: 'contact_date', header: 'Contact Date' },
  ]

  function exportExcel() {
    try {
      const rows = customers.map((customer) => Object.fromEntries(
        excelColumns.map(({ key, header }) => [header, customer[key] ?? ''])
      ))
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: excelColumns.map((column) => column.header) })
      worksheet['!cols'] = excelColumns.map((column) => ({ wch: Math.max(column.header.length + 2, 18) }))
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')
      XLSX.writeFile(workbook, `Surya_Industries_Customers_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (error) {
      console.error('Excel export failed:', error)
      alert(`Could not export Excel: ${error.message || 'Unknown error'}`)
    }
  }

  function normalizeImportRow(row) {
    const normalized = {}
    for (const [header, value] of Object.entries(row)) {
      const key = String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      const aliases = {
        clientcompanyname: 'client_name', clientname: 'client_name', companyname: 'client_name', client_name: 'client_name',
        contactperson: 'contact_person', contact_person: 'contact_person', contactnumber: 'contact_number', contactno: 'contact_number', contactnumber1: 'contact_number', contact_number: 'contact_number',
        officenumber: 'office_number', officeno: 'office_number', office_number: 'office_number',
        postdesignation: 'designation', designation: 'designation', post: 'designation',
        mailid: 'email', email: 'email', emailaddress: 'email',
        categorydetails: 'category', category: 'category', details: 'category',
        remark: 'remark', remarks: 'remark', contactdate: 'contact_date', contact_date: 'contact_date',
      }
      const field = aliases[key]
      if (field) normalized[field] = value
    }
    return normalized
  }

  function excelDate(value) {
    if (value === null || value === undefined || value === '') return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value)
      if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
    }
    const text = String(value).trim()
    if (!text) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    const date = new Date(text)
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
  }

  async function importExcel(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setExcelBusy(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error('The workbook does not contain a worksheet.')
      const sourceRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false })
      if (!sourceRows.length) throw new Error('The worksheet is empty.')
      const rows = sourceRows.map(normalizeImportRow).filter((row) => String(row.client_name ?? '').trim())
      if (!rows.length) throw new Error('No rows with a Client / Company Name were found. Use the Export Excel file as a template.')
      const payload = rows.map((row) => ({
        client_name: String(row.client_name).trim().slice(0, 200),
        contact_person: String(row.contact_person ?? '').trim() || null,
        contact_number: String(row.contact_number ?? '').trim() || null,
        office_number: String(row.office_number ?? '').trim() || null,
        designation: String(row.designation ?? '').trim() || null,
        email: String(row.email ?? '').trim() || null,
        category: String(row.category ?? '').trim() || null,
        remark: String(row.remark ?? '').trim() || null,
        contact_date: excelDate(row.contact_date),
      }))
      let inserted = 0
      for (let start = 0; start < payload.length; start += 100) {
        const batch = payload.slice(start, start + 100)
        const { error } = await supabase.from('customers').insert(batch)
        if (error) throw new Error(`Imported ${inserted} rows before an error: ${error.message}`)
        inserted += batch.length
      }
      await fetchCustomers()
      alert(`Import complete: ${inserted} customer row(s) added. Documents are not imported from Excel.`)
    } catch (error) {
      console.error('Excel import failed:', error)
      alert(`Could not import Excel: ${error.message || 'Unknown error'}`)
    } finally {
      setExcelBusy(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase().trim()

    if (!searchText) {
      return true
    }

    return (
      String(customer.sr_no || '').toLowerCase().includes(searchText) ||
      String(customer.client_name || '').toLowerCase().includes(searchText) ||
      String(customer.contact_person || '').toLowerCase().includes(searchText) ||
      String(customer.contact_number || '').toLowerCase().includes(searchText) ||
      String(customer.office_number || '').toLowerCase().includes(searchText) ||
      String(customer.designation || '').toLowerCase().includes(searchText) ||
      String(customer.email || '').toLowerCase().includes(searchText) ||
      String(customer.category || '').toLowerCase().includes(searchText) ||
      String(customer.remark || '').toLowerCase().includes(searchText)
    )
  })

  function handleEdit(customer) {
    setEditingCustomer(customer)
  }

  async function handleDelete(customer) {
    const confirmed = window.confirm(`Delete "${customer.client_name}"? This will remove the customer record and its document records. This action cannot be undone.`)
    if (!confirmed) return

    try {
      const { data: docs, error: docsError } = await supabase
        .from('customer_documents')
        .select('id, storage_path')
        .eq('customer_id', customer.id)
      if (docsError) throw docsError

      const paths = (docs || []).map((doc) => doc.storage_path).filter(Boolean)
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from('customer-documents').remove(paths)
        if (storageError) throw storageError
      }

      if (docs?.length) {
        const { error: metadataError } = await supabase
          .from('customer_documents')
          .delete()
          .eq('customer_id', customer.id)
        if (metadataError) throw metadataError
      }

      const { error: customerError } = await supabase.from('customers').delete().eq('id', customer.id)
      if (customerError) throw customerError
      await fetchCustomers()
    } catch (error) {
      console.error('Delete customer failed:', error)
      alert(`Could not delete customer: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-4">

                <img
                src={logo}
                alt="Surya Industries"
                className="h-27 w-auto object-contain"
                />

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  SURYA INDUSTRIES
                </h1>

                <p className="text-sm text-gray-500">
                  Customer Contact Management
                </p>
              </div>

            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        <ClientLinks />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">

          {/* Directory Header */}
          <div className="p-5 border-b border-gray-200">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Customer Directory
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {customers.length} customer
                  {customers.length !== 1 ? 's' : ''}
                </p>
              </div>

            <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
            + Add Customer
            </button>

            </div>

            {/* Search */}
            <div className="mt-5">

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search customers..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Excel import/export */}
            <div className="mt-4 flex flex-wrap gap-3">
              <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" aria-label="Choose Excel file to import" />
              <button type="button" onClick={() => importInputRef.current?.click()} disabled={excelBusy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
                {excelBusy ? 'Importing…' : 'Import Excel'}
              </button>
              <button type="button" onClick={exportExcel} disabled={excelBusy || customers.length === 0} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
                Export Excel
              </button>
              <p className="self-center text-xs text-gray-500">Import requires a “Client / Company Name” column. Export downloads all customers.</p>
            </div>

          </div>

          {/* Customer Table */}
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading customers...
            </div>
          ) : (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

        </div>

      </main>
            {(showAddForm || editingCustomer) && (
        <CustomerForm
          initialCustomer={editingCustomer}
          onClose={() => {
            setShowAddForm(false)
            setEditingCustomer(null)
          }}
          onCustomerAdded={() => {
            setShowAddForm(false)
            setEditingCustomer(null)
            fetchCustomers()
          }}
        />
      )}
    </div>
  )
}

export default Dashboard