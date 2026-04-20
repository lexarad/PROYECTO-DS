'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type BotMessage = {
  role: 'user' | 'bot'
  text: string
  links?: { url: string; label: string; desc?: string }[]
}

const CERTIFICADOS_MAP = [
  {
    keywords: /nac(imiento|io)|partida de nac|birth certif/,
    url: '/solicitar/nacimiento',
    label: 'Solicitar certificado de Nacimiento',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /matrimon|casad[oa]|boda|casamiento/,
    url: '/solicitar/matrimonio',
    label: 'Solicitar certificado de Matrimonio',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /defunci|fallec(ido|imiento)|muerte|difunto/,
    url: '/solicitar/defuncion',
    label: 'Solicitar certificado de Defunción',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /empadron|padron|certif.*resid|resid.*certif|municipio.*certif/,
    url: '/solicitar/empadronamiento',
    label: 'Solicitar certificado de Empadronamiento',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /anteceden|penal|judicial|policial|buena conduc/,
    url: '/solicitar/antecedentes_penales',
    label: 'Solicitar Antecedentes Penales',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /vida laboral|cotizaci|seguridad social|historial.*trab|informe.*trab/,
    url: '/solicitar/vida_laboral',
    label: 'Solicitar Vida Laboral',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /ultimas voluntad|testamento|acto.*ultima/,
    url: '/solicitar/ultimas_voluntades',
    label: 'Solicitar Últimas Voluntades',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /seguro.*fallec|fallec.*seguro|poliza.*vida|seguro.*muerte/,
    url: '/solicitar/seguros_fallecimiento',
    label: 'Solicitar Seguros de Fallecimiento',
    desc: 'desde 9,90 €',
  },
  {
    keywords: /ocr|escanear|digitaliz|extrae.*doc|texto.*imagen|foto.*doc/,
    url: '/solicitar/ocr_extraccion',
    label: 'Extracción OCR de documento',
    desc: '4,90 €',
  },
  {
    keywords: /inmueble|nota simple|registro.*propiedad|titular.*piso|titular.*casa|propiedad.*quien/,
    url: '/solicitar/titularidad_inmueble',
    label: 'Solicitar Titularidad de Inmueble',
    desc: '29,90 €',
  },
]

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function detectarIntento(text: string): BotMessage | null {
  const t = normalize(text)

  // Herencia — sugiere 3 certificados
  if (/herencia|heredar|heredero|falleci.*padre|falleci.*madre|falleci.*fami/.test(t)) {
    return {
      role: 'bot',
      text: 'Para un proceso de herencia normalmente necesitas tres documentos. Te dejo los enlaces directos para solicitar cada uno:',
      links: [
        { url: '/solicitar/defuncion', label: 'Certificado de Defunción', desc: 'desde 9,90 €' },
        { url: '/solicitar/ultimas_voluntades', label: 'Últimas Voluntades', desc: 'desde 9,90 €' },
        { url: '/solicitar/seguros_fallecimiento', label: 'Seguros de Fallecimiento', desc: 'desde 9,90 €' },
      ],
    }
  }

  // Renovación DNI/pasaporte → necesita nacimiento
  if (/dni|pasaporte|renov/.test(t)) {
    return {
      role: 'bot',
      text: 'Para renovar el DNI o el pasaporte necesitas el certificado de nacimiento. Aquí puedes solicitarlo:',
      links: [{ url: '/solicitar/nacimiento', label: 'Solicitar certificado de Nacimiento', desc: 'desde 9,90 €' }],
    }
  }

  // Buscar coincidencia directa con un certificado
  for (const cert of CERTIFICADOS_MAP) {
    if (cert.keywords.test(t)) {
      return {
        role: 'bot',
        text: `¡Entendido! Te redirigimos directamente al formulario para solicitarlo:`,
        links: [{ url: cert.url, label: cert.label, desc: cert.desc }],
      }
    }
  }

  return null
}

function generarRespuesta(text: string): BotMessage {
  const intento = detectarIntento(text)
  if (intento) return intento

  const t = normalize(text)

  if (/hola|buenas|hey|saludos/.test(t)) {
    return { role: 'bot', text: '¡Hola! Soy Becario 👋 Cuéntame qué certificado o documento necesitas y te indico exactamente cómo pedirlo.' }
  }
  if (/precio|cuesta|costo|cuanto|tarifa/.test(t)) {
    return { role: 'bot', text: 'Los certificados del Registro Civil cuestan desde 9,90 €. La extracción OCR son 4,90 € y la titularidad de inmueble 29,90 €. Todos sin necesidad de certificado digital ni Cl@ve.' }
  }
  if (/tiempo|tarda|plazo|entrega|cuando/.test(t)) {
    return { role: 'bot', text: 'El tiempo medio de entrega es de 24 a 72 horas hábiles, dependiendo del tipo de certificado.' }
  }
  if (/extranjero|fuera.*españa|otro.*pais|vivir.*fuera/.test(t)) {
    return { role: 'bot', text: 'Sin problema. CertiDocs funciona desde cualquier país del mundo. No necesitas estar en España para solicitar tus certificados.' }
  }
  if (/clave|certificado digital|dni electron|firma digital/.test(t)) {
    return { role: 'bot', text: 'No necesitas Cl@ve ni certificado digital. Nosotros gestionamos el trámite completo. Solo rellenas el formulario y nosotros hacemos el resto.' }
  }
  if (/estado|seguimiento|donde.*solicitud|mi.*pedido/.test(t)) {
    return {
      role: 'bot',
      text: 'Puedes consultar el estado de tu solicitud aquí:',
      links: [{ url: '/seguimiento', label: 'Ver estado de mi solicitud' }],
    }
  }
  if (/ayuda|que.*hace|como.*funciona|servicios/.test(t)) {
    return {
      role: 'bot',
      text: 'Gestiono certificados del Registro Civil (nacimiento, matrimonio, defunción), empadronamiento, antecedentes penales, vida laboral, últimas voluntades, seguros de fallecimiento, titularidad de inmueble y extracción OCR. ¿Cuál necesitas?',
    }
  }

  return {
    role: 'bot',
    text: '¿Qué certificado necesitas? Puedes decirme por ejemplo: "certificado de nacimiento", "antecedentes penales", "vida laboral"... y te llevo directamente al formulario correcto.',
  }
}

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<BotMessage[]>([
    { role: 'bot', text: '¡Hola! Soy Becario 👋 Dime qué certificado necesitas y te indico exactamente cómo pedirlo.' },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return
    const userText = message.trim()
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setMessage('')
    setShowBubble(false)

    setTimeout(() => {
      setMessages(prev => [...prev, generarRespuesta(userText)])
    }, 600)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(!open); setShowBubble(false) }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center"
        aria-label="Abrir chat de ayuda"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-xl">🤖</span>
        )}
      </button>

      {!open && showBubble && (
        <div className="fixed bottom-24 right-6 z-40">
          <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-[200px]">
            <p className="text-sm text-gray-700 dark:text-gray-300">👋 ¿Qué certificado necesitas?</p>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-sm">Becario — Asistente CertiDocs</p>
              <p className="text-xs text-brand-100">Te ayudo a encontrar el formulario correcto</p>
            </div>
          </div>

          <div className="flex-1 h-[340px] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 w-full max-w-[88%]">
                    {msg.links.map(link => (
                      <Link
                        key={link.url}
                        href={link.url}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                      >
                        <span>{link.label}</span>
                        <span className="flex items-center gap-1 text-brand-100 text-xs flex-shrink-0">
                          {link.desc && <span>{link.desc}</span>}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej: certificado de nacimiento..."
                className="flex-1 input text-sm py-2"
                autoComplete="off"
              />
              <button type="submit" className="bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
