import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEnvelope, faLocationDot, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faTelegram } from '@fortawesome/free-brands-svg-icons'
import { useLanguage } from '../contexts/LanguageContext'
import { ui } from '../i18n/translations'

const footerNavHrefs = ['/', '/?cat=1', '/?cat=2', '/?cat=4', '/?cat=6']

export default function Footer() {
  const { lang, isKh } = useLanguage()
  const t = ui[lang]

  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-gold-400 font-bold text-lg mb-2 font-battambang">
              {isKh ? 'នគរបាលជាតិ' : 'Cambodia National Police'}
            </h3>
            <p className="text-gray-300 text-sm mb-1">
              {isKh ? 'Cambodia National Police' : 'នគរបាលជាតិ'}
            </p>
            <p className="text-gray-400 text-xs leading-relaxed mt-3">
              {isKh ? 'ក្រសួងមហាផ្ទៃ — Ministry of Interior' : 'Ministry of Interior'}<br />
              {t.footerAddress}
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-primary-700 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors">
                <FontAwesomeIcon icon={faFacebook} className="text-white text-sm" />
              </a>
              <a href="#" className="w-8 h-8 bg-primary-700 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors">
                <FontAwesomeIcon icon={faTelegram} className="text-white text-sm" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-gold-400 font-semibold mb-3 text-sm">{t.footerLinks}</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {t.footerLinks_items.map((item, i) => (
                <li key={i}>
                  <Link to={footerNavHrefs[i] ?? '/'} className="hover:text-gold-400 transition-colors flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faChevronRight} className="text-gold-400 text-[10px]" />{item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-gold-400 font-semibold mb-3 text-sm">{t.footerContact}</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-start gap-2"><FontAwesomeIcon icon={faPhone} className="text-gold-400 mt-0.5 shrink-0" /><span>117 / 023 726 158</span></li>
              <li className="flex items-start gap-2"><FontAwesomeIcon icon={faEnvelope} className="text-gold-400 mt-0.5 shrink-0" /><span>info@police.gov.kh</span></li>
              <li className="flex items-start gap-2"><FontAwesomeIcon icon={faLocationDot} className="text-gold-400 mt-0.5 shrink-0" /><span>{t.footerAddress}</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} {isKh ? 'នគរបាលជាតិ —' : ''} Cambodia National Police. All rights reserved.</span>
          <span>Powered by React + Hono + MySQL</span>
        </div>
      </div>
    </footer>
  )
}
