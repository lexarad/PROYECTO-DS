'use client'

import { useState, useEffect, useRef } from 'react'

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Hola! Soy Becario 👋 ¿En qué te puedo ayudar hoy?' },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return

    const userText = message.trim()
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setMessage('')

    // Respuesta automatica inteligente
    setTimeout(() => {
      let respuesta = ''
      const text = userText.toLowerCase()

      if (text.includes('precio') || text.includes('cuesta') || text.includes('cuanto')) {
        respuesta = 'Los certificados empiezan desde 9,90€. Cada servicio tiene un precio diferente en la página principal.'
      } else if (text.includes('tiempo') || text.includes('cuanto tarda') || text.includes('entrega')) {
        respuesta = 'El tiempo medio de entrega es de 24 a 72 horas hábiles. Depende del tipo de certificado que necesites.'
      } else if (text.includes('nota') || text.includes('titularidad') || text.includes('inmueble')) {
        respuesta = 'Perfecto! El nuevo servicio Comprobación Titularidad de Inmueble cuesta 29,90€ y te entregamos la nota simple del registro de la propiedad.'
      } else if (text.includes('defuncion') || text.includes('fallecido') || text.includes('herencia')) {
        respuesta = 'Para herencias necesitas 3 certificados: Defunción, Últimas Voluntades y Seguros de Fallecimiento. Lo tramitamos todo para ti en menos de 72h.'
      } else if (text.includes('extranjero') || text.includes('fuera') || text.includes('vivo en')) {
        respuesta = 'No hay problema! Funcionamos para residentes en cualquier país del mundo. No necesitas estar en España.'
      } else if (text.includes('clave') || text.includes('certificado digital') || text.includes('dni electronico')) {
        respuesta = 'No necesitas nada! Nosotros nos encargamos de todo el trámite. Sin Cl@ve, sin certificado digital, sin colas.'
      } else if (text.includes('modo oscuro') || text.includes('dark') || text.includes('negro')) {
        respuesta = 'Arriba a la derecha tienes el botón de modo oscuro, lo puedes activar cuando quieras 🌙'
      } else {
        respuesta = 'Claro que sí! Dime que tipo de certificado necesitas y te explico todo el proceso paso a paso 😊'
      }

      setMessages(prev => [...prev, { role: 'bot', text: respuesta }])
    }, 700)
  }

  return (
    <>
      {/* Boton fijo inferior derecha */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-xl">🤖</span>
        )}
      </button>

      {/* Ventana de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Cabecera */}
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold">Becario</p>
              <p className="text-xs text-brand-100">Asistente CertiDocs</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="h-[320px] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu pregunta..."
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

      {/* Aviso inicial animado */}
      {!open && (
        <div className="fixed bottom-24 right-6 z-40 animate-bounce">
          <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">👋 Hola! ¿Te puedo ayudar?</p>
          </div>
        </div>
      )}
    </>
  )
}