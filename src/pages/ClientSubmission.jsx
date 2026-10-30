import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/surya-industries-logo.png'

const allowedTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])
const maxFileSize = 10 * 1024 * 1024

async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

const text = {
  hi: {
    title: 'ग्राहक जानकारी फॉर्म',
    subtitle: 'कृपया नीचे दी गई जानकारी भरें। जिन जगहों पर * है, उन्हें भरना ज़रूरी है।',
    client: 'ग्राहक / कंपनी का नाम',
    clientPlaceholder: 'यहाँ ग्राहक या कंपनी का नाम लिखें',
    person: 'संपर्क व्यक्ति का नाम',
    personPlaceholder: 'अपना नाम लिखें',
    designation: 'पद / काम',
    designationPlaceholder: 'जैसे: मैनेजर, मालिक',
    phone: 'मोबाइल नंबर',
    phonePlaceholder: 'अपना मोबाइल नंबर लिखें',
    office: 'ऑफिस नंबर (यदि हो)',
    officePlaceholder: 'ऑफिस का फोन नंबर',
    email: 'ईमेल (यदि हो)',
    emailPlaceholder: 'ईमेल पता',
    date: 'आज की तारीख / संपर्क तारीख',
    category: 'आपको क्या चाहिए? / सामान या काम का पूरा विवरण',
    categoryHelp: 'यहाँ कुछ पंक्तियों में लिखें कि आपको कौन-सा सामान या काम चाहिए। आप हिंदी या अंग्रेज़ी में लिख सकते हैं।',
    categoryPlaceholder: 'उदाहरण: लोहे की 20 प्लेट चाहिए। आकार 4 फीट × 3 फीट। कृपया कीमत बताएं।',
    remark: 'अन्य जानकारी (यदि हो)',
    remarkPlaceholder: 'कोई और बात बतानी हो तो यहाँ लिखें',
    docs: 'दस्तावेज़ या फोटो (ज़रूरी नहीं)',
    docsHelp: 'अधिकतम 5 फाइलें। हर फाइल 10 MB तक हो सकती है।',
    choose: 'फाइल चुनें',
    selected: 'चुनी गई फाइलें',
    submit: 'जानकारी भेजें',
    submitting: 'भेजा जा रहा है…',
    required: 'कृपया ग्राहक / कंपनी का नाम भरें।',
    invalid: 'यह लिंक सही नहीं है, इसकी समय-सीमा समाप्त हो गई है या इसका उपयोग हो चुका है।',
    contact: 'कृपया Surya Industries से नया लिंक माँगें।',
    success: 'आपकी जानकारी भेज दी गई है।',
    successHelp: 'धन्यवाद! Surya Industries की टीम आपकी जानकारी देखेगी।',
    remove: 'हटाएँ',
    errorFile: 'कृपया PDF, JPG, PNG, WEBP, DOC, DOCX, XLS या XLSX फाइल चुनें। हर फाइल 10 MB तक हो सकती है।',
    errorCount: 'आप अधिकतम 5 दस्तावेज़ जोड़ सकते हैं।',
    errorSubmit: 'जानकारी भेजी नहीं जा सकी। कृपया दोबारा कोशिश करें या Surya Industries से संपर्क करें।',
    language: 'English',
    brand: 'सूर्या इंडस्ट्रीज़',
    checking: 'लिंक जाँचा जा रहा है…',
  },
  en: {
    title: 'Customer Information Form',
    subtitle: 'Please fill in the details below. Fields marked * are required.',
    client: 'Customer / Company Name',
    clientPlaceholder: 'Enter customer or company name',
    person: 'Contact Person',
    personPlaceholder: 'Enter your name',
    designation: 'Designation / Role',
    designationPlaceholder: 'e.g. Manager, Owner',
    phone: 'Mobile Number',
    phonePlaceholder: 'Enter mobile number',
    office: 'Office Number (if any)',
    officePlaceholder: 'Enter office phone number',
    email: 'Email (optional)',
    emailPlaceholder: 'Enter email address',
    date: 'Contact Date',
    category: 'What do you need? / Details of goods or work',
    categoryHelp: 'Describe the item or work you need in a few lines. You can write in Hindi or English.',
    categoryPlaceholder: 'Example: Need 20 iron plates, size 4 ft × 3 ft. Please share the price.',
    remark: 'Other Information (optional)',
    remarkPlaceholder: 'Write any additional information here',
    docs: 'Documents or Photos (optional)',
    docsHelp: 'Maximum 5 files. Each file can be up to 10 MB.',
    choose: 'Choose files',
    selected: 'Selected files',
    submit: 'Submit Information',
    submitting: 'Submitting…',
    required: 'Please enter the customer / company name.',
    invalid: 'This link is invalid, expired, or has already been used.',
    contact: 'Please contact Surya Industries to request a new link.',
    success: 'Your information has been submitted.',
    successHelp: 'Thank you! The Surya Industries team will review your information.',
    remove: 'Remove',
    errorFile: 'Choose PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, or XLSX files up to 10 MB each.',
    errorCount: 'You can upload a maximum of 5 documents.',
    errorSubmit: 'Your information could not be submitted. Please try again or contact Surya Industries.',
    language: 'हिंदी',
    brand: 'SURYA INDUSTRIES',
    checking: 'Checking invitation link…',
  },
}

export default function ClientSubmission() {
  const { token, isPublic } = useMemo(() => { const params = new URLSearchParams(window.location.search); return { token: params.get('token') || '', isPublic: params.get('public') === '1' } }, [])
  const [language, setLanguage] = useState('hi')
  const t = text[language]
  const [linkState, setLinkState] = useState('checking')
  const [form, setForm] = useState({
    client_name: '', contact_person: '', contact_number: '', office_number: '',
    designation: '', email: '', category: '', remark: '', contact_date: new Date().toLocaleDateString('en-CA'),
  })
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function validate() {
      if (isPublic) { setLinkState('valid'); return }
      if (!token) { setLinkState('invalid'); return }
      try {
        const tokenHash = await hashToken(token)
        const { data, error } = await supabase.rpc('validate_client_submission_link', { p_token_hash: tokenHash })
        if (cancelled) return
        setLinkState(!error && data?.valid ? 'valid' : 'invalid')
      } catch {
        if (!cancelled) setLinkState('invalid')
      }
    }
    validate()
    return () => { cancelled = true }
  }, [token, isPublic])

  function change(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }))
  }

  function chooseFiles(e) {
    const selected = Array.from(e.target.files || [])
    if (files.length + selected.length > 5) {
      setMessage(t.errorCount)
      e.target.value = ''
      return
    }
    if (selected.some((file) => !allowedTypes.has(file.type) || file.size > maxFileSize)) {
      setMessage(t.errorFile)
      e.target.value = ''
      return
    }
    setFiles((old) => [...old, ...selected])
    setMessage('')
    e.target.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.client_name.trim()) { setMessage(t.required); return }
    setSaving(true)
    setMessage('')
    const tokenHash = isPublic ? '' : await hashToken(token)
    const uploadFolder = isPublic ? 'public' : tokenHash
    const uploaded = []
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${uploadFolder}/${crypto.randomUUID()}-${safeName}`
        const { error } = await supabase.storage.from('customer-documents').upload(path, file, { upsert: false })
        if (error) throw new Error(error.message)
        uploaded.push({
          file_name: file.name, file_type: file.type || 'application/octet-stream',
          file_size: file.size, storage_path: path,
        })
      }
      const { error } = isPublic
        ? await supabase.rpc('submit_public_customer_details', {
            p_customer: { ...form, client_name: form.client_name.trim(), category: form.category.trim() || null, contact_date: form.contact_date || null },
            p_documents: uploaded,
          })
        : await supabase.rpc('submit_client_customer_details', {
            p_token_hash: tokenHash,
            p_customer: { ...form, client_name: form.client_name.trim(), category: form.category.trim() || null, contact_date: form.contact_date || null },
            p_documents: uploaded,
          })
      if (error) throw error
      setLinkState('submitted')
    } catch (error) {
      console.error('Client submission failed:', error)
      setMessage(`${t.errorSubmit}${error?.message ? ` (${error.message})` : ''}`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'
  const labelClass = 'block text-base font-semibold text-gray-800'

  return (
    <div lang={language} className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Surya Industries" className="h-14 w-auto object-contain sm:h-16" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl">{t.brand}</h1>
              <p className="mt-1 text-sm text-gray-600">{t.title}</p>
            </div>
          </div>
          <button type="button" onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">{t.language}</button>
        </header>

        <main className="px-5 py-6 sm:px-8 sm:py-8">
          {linkState === 'checking' && <p className="py-12 text-center text-lg text-gray-700">{t.checking}</p>}
          {linkState === 'invalid' && <div className="py-10 text-center"><h2 className="text-xl font-bold text-gray-900">{t.invalid}</h2><p className="mt-3 text-gray-700">{t.contact}</p></div>}
          {linkState === 'submitted' && <div className="py-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div><h2 className="mt-4 text-2xl font-bold text-gray-900">{t.success}</h2><p className="mt-2 text-gray-700">{t.successHelp}</p></div>}
          {linkState === 'valid' && (
            <form onSubmit={submit} className="space-y-6">
              <div className="rounded-xl bg-teal-50 p-4 text-gray-800">
                <h2 className="text-xl font-bold">{t.title}</h2>
                <p className="mt-2 leading-7">{t.subtitle}</p>{isPublic && <p className="mt-2 rounded-lg bg-white/70 p-3 text-sm">यह सार्वजनिक फॉर्म है। जानकारी भेजने के लिए आपको व्यक्तिगत लिंक की आवश्यकता नहीं है।</p>}
              </div>
              <div>
                <label className={labelClass}>{t.client} *</label>
                <input name="client_name" value={form.client_name} onChange={change} required maxLength={200} className={inputClass} placeholder={t.clientPlaceholder} />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div><label className={labelClass}>{t.person}</label><input name="contact_person" value={form.contact_person} onChange={change} className={inputClass} placeholder={t.personPlaceholder} /></div>
                <div><label className={labelClass}>{t.designation}</label><input name="designation" value={form.designation} onChange={change} className={inputClass} placeholder={t.designationPlaceholder} /></div>
                <div><label className={labelClass}>{t.phone}</label><input type="tel" name="contact_number" value={form.contact_number} onChange={change} className={inputClass} placeholder={t.phonePlaceholder} /></div>
                <div><label className={labelClass}>{t.office}</label><input type="tel" name="office_number" value={form.office_number} onChange={change} className={inputClass} placeholder={t.officePlaceholder} /></div>
                <div><label className={labelClass}>{t.email}</label><input type="email" name="email" value={form.email} onChange={change} className={inputClass} placeholder={t.emailPlaceholder} /></div>
                <div><label className={labelClass}>{t.date}</label><input type="date" name="contact_date" value={form.contact_date} onChange={change} className={inputClass} /></div>
              </div>
              <div>
                <label className={labelClass}>{t.category}</label>
                <textarea name="category" value={form.category} onChange={change} rows={5} maxLength={5000} className={inputClass} placeholder={t.categoryPlaceholder} />
                <p className="mt-2 text-sm leading-6 text-gray-600">{t.categoryHelp}</p>
              </div>
              <div>
                <label className={labelClass}>{t.remark}</label>
                <textarea name="remark" value={form.remark} onChange={change} rows={3} className={inputClass} placeholder={t.remarkPlaceholder} />
              </div>
              <div>
                <label className={labelClass}>{t.docs}</label>
                <p className="mt-1 text-sm text-gray-600">{t.docsHelp}</p>
                <input type="file" multiple onChange={chooseFiles} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className="mt-3 block w-full rounded-xl border border-gray-300 p-3 text-base" />
                {files.length > 0 && <div className="mt-3 space-y-2"><p className="text-sm font-semibold text-gray-700">{t.selected} ({files.length}/5)</p>{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-sm"><span className="min-w-0 break-all">{file.name}</span><button type="button" onClick={() => setFiles((old) => old.filter((_, i) => i !== index))} className="shrink-0 font-semibold text-red-700">{t.remove}</button></div>)}</div>}
              </div>
              {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-800">{message}</p>}
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-teal-700 px-5 py-4 text-lg font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? t.submitting : t.submit}</button>
              <p className="text-center text-sm text-gray-500">Surya Industries · Customer Information</p>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
