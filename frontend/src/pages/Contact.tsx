import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPhone,
  faEnvelope,
  faLocationDot,
  faCircleCheck,
  faPaperPlane,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../components/Sidebar'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-primary-800 py-2">
        <div className="max-w-7xl mx-auto px-4 text-xs text-gray-300 flex items-center gap-2">
          <span>ទំព័រដើម</span>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-500" />
          <span>ទំនាក់ទំនង</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2 space-y-6">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: faPhone, titleKh: 'ខ្សែក្ដៅ', title: 'Hotline', value: '117', sub: '24/7 Emergency', color: 'text-red-500' },
                { icon: faEnvelope, titleKh: 'អ៊ីមែល', title: 'Email', value: 'info@police.gov.kh', sub: 'Response within 24h', color: 'text-blue-500' },
                { icon: faLocationDot, titleKh: 'អាសយដ្ឋាន', title: 'Address', value: 'ភ្នំពេញ', sub: 'Phnom Penh, Cambodia', color: 'text-green-500' },
              ].map((c) => (
                <div key={c.title} className="bg-white rounded-lg shadow-sm p-4 text-center border border-gray-100">
                  <FontAwesomeIcon icon={c.icon} className={`text-3xl mb-2 ${c.color}`} />
                  <h3 className="font-bold text-primary-800 text-sm">{c.titleKh}</h3>
                  <p className="text-gray-800 font-semibold mt-1">{c.value}</p>
                  <p className="text-gray-400 text-xs">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-gold-500 rounded" />
                <h2 className="font-bold text-primary-800 text-lg">ទំនាក់ទំនងមកយើង</h2>
              </div>

              {sent ? (
                <div className="text-center py-10">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-green-500 mb-3" />
                  <h3 className="text-lg font-bold text-green-600 mb-1">សាររបស់អ្នកបានផ្ញើជោគជ័យ!</h3>
                  <p className="text-gray-500 text-sm">Your message has been sent. We will respond within 24 hours.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                    className="mt-4 btn-primary flex items-center gap-2 mx-auto"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    ផ្ញើសារថ្មី
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ឈ្មោះ / Name *</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">អ៊ីមែល / Email *</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">លេខទូរស័ព្ទ / Phone</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ប្រធានបទ / Subject *</label>
                      <input type="text" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">សារ / Message *</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <FontAwesomeIcon icon={faPaperPlane} />
                    ផ្ញើសារ / Send Message
                  </button>
                </form>
              )}
            </div>
          </main>

          <Sidebar />
        </div>
      </div>
    </div>
  )
}
