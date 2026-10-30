import { useState } from 'react'
import { supabase } from '../lib/supabase'

const emptyForm = {
  client_name: '',
  contact_person: '',
  contact_number: '',
  office_number: '',
  designation: '',
  email: '',
  category: '',
  remark: '',
  contact_date: '',
}

function CustomerForm({ onClose, onCustomerAdded, initialCustomer = null }) {
  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    ...(initialCustomer || {}),
    contact_date: initialCustomer?.contact_date || '',
    category: initialCustomer?.category || '',
  }))
  const [documents, setDocuments] = useState([])
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(initialCustomer?.id)

  function handleChange(e) {
    setFormData((previous) => ({ ...previous, [e.target.name]: e.target.value }))
  }

  function handleDocumentChange(e) {
    const selectedFiles = Array.from(e.target.files || [])
    const slots = 5 - documents.length
    if (selectedFiles.length > slots) {
      alert(`You can add up to 5 documents. You can add ${slots} more.`)
    }
    setDocuments((previous) => [...previous, ...selectedFiles.slice(0, Math.max(0, slots))])
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    let customer
    try {
      const payload = {
        client_name: formData.client_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        office_number: formData.office_number.trim() || null,
        designation: formData.designation.trim() || null,
        email: formData.email.trim() || null,
        category: formData.category.trim() || null,
        remark: formData.remark.trim() || null,
        contact_date: formData.contact_date || null,
      }

      if (isEditing) {
        const { data, error } = await supabase.from('customers').update(payload).eq('id', initialCustomer.id).select().single()
        if (error) throw error
        customer = data
      } else {
        const { data, error } = await supabase.from('customers').insert(payload).select().single()
        if (error) throw error
        customer = data
      }

      for (const file of documents) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = `${customer.id}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('customer-documents').upload(filePath, file)
        if (uploadError) throw new Error(`Document upload failed: ${uploadError.message}`)
        const { error: metadataError } = await supabase.from('customer_documents').insert({
          customer_id: customer.id,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          storage_path: filePath,
        })
        if (metadataError) throw new Error(`Document record failed: ${metadataError.message}`)
      }

      alert(isEditing ? 'Customer updated successfully.' : 'Customer saved successfully.')
      onCustomerAdded()
    } catch (error) {
      console.error('Could not save customer:', error)
      alert(`Could not save customer: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  const labelClass = 'mb-2 block text-sm font-medium text-gray-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{isEditing ? 'Edit Customer' : 'Add Customer'}</h2>
            <p className="mt-1 text-sm text-gray-500">Enter customer details. Category is a multiline description.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="text-2xl text-gray-500 hover:text-gray-800">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Client / Company Name *</label>
              <input name="client_name" value={formData.client_name || ''} onChange={handleChange} required maxLength={200} className={inputClass} placeholder="Enter client or company name" />
            </div>
            <div>
              <label className={labelClass}>Contact Person</label>
              <input name="contact_person" value={formData.contact_person || ''} onChange={handleChange} className={inputClass} placeholder="Name of contact person" />
            </div>
            <div>
              <label className={labelClass}>Post / Designation</label>
              <input name="designation" value={formData.designation || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Manager" />
            </div>
            <div>
              <label className={labelClass}>Contact Number</label>
              <input type="tel" name="contact_number" value={formData.contact_number || ''} onChange={handleChange} className={inputClass} placeholder="Phone number" />
            </div>
            <div>
              <label className={labelClass}>Office Number</label>
              <input type="tel" name="office_number" value={formData.office_number || ''} onChange={handleChange} className={inputClass} placeholder="Office phone number" />
            </div>
            <div>
              <label className={labelClass}>Mail ID</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="Email address" />
            </div>
            <div>
              <label className={labelClass}>Contact Date</label>
              <input type="date" name="contact_date" value={formData.contact_date || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Category / Details (विवरण)</label>
              <textarea name="category" value={formData.category || ''} onChange={handleChange} rows={5} maxLength={5000} className={inputClass} placeholder="Write the category or details here. You can write multiple lines." />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Remark</label>
              <textarea name="remark" value={formData.remark || ''} onChange={handleChange} rows={3} className={inputClass} placeholder="Additional notes" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Documents <span className="font-normal text-gray-500">(Optional, maximum 5 new files)</span></label>
              <input type="file" multiple onChange={handleDocumentChange} className="block w-full rounded-lg border border-gray-300 p-3 text-sm" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" />
              <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, WEBP, DOC, DOCX, XLS or XLSX; maximum 10 MB per file.</p>
              {documents.map((file, i) => <div key={`${file.name}-${i}`} className="mt-2 flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm"><span className="truncate">{file.name}</span><button type="button" onClick={() => setDocuments((old) => old.filter((_, index) => index !== i))} className="ml-3 text-red-600">Remove</button></div>)}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerForm
