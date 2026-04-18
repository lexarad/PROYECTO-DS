'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

type DatosDiarios = { fecha: string; total: number }
type DatosMensuales = { mes: string; count: number }
type DatosTipo = { tipo: string; count: number; ingresos: number }

const COLORS = [
  '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa',
  '#93c5fd', '#1e40af', '#7c3aed', '#a78bfa',
]

function fmt(v: number) {
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'
}

export function GraficoIngresos({ data }: { data: DatosDiarios[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v + ' €'}
          width={52}
          tickCount={5}
        />
        <Tooltip
          formatter={(v) => [fmt(Number(v ?? 0)), 'Ingresos']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#1d4ed8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function GraficoUsuarios({ data }: { data: DatosMensuales[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
        <Tooltip
          formatter={(v) => [Number(v ?? 0), 'Usuarios nuevos']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function GraficoTipos({ data }: { data: DatosTipo[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.tipo}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-700 font-medium truncate max-w-[180px]">{d.tipo}</span>
            <span className="text-gray-500 ml-2">{d.count} · {fmt(d.ingresos)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.count / max) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
