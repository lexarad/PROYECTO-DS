import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { FacturaConDatos, EMPRESA } from '@/lib/factura'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 48,
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  brand: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  brandSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textAlign: 'right',
  },
  invoiceNum: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  divider: {
    borderBottom: '1pt solid #e5e7eb',
    marginVertical: 16,
  },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  colLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  colValue: {
    fontSize: 10,
    color: '#111827',
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  colDesc: { flex: 3 },
  colBase: { flex: 1, textAlign: 'right' },
  colIva: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalesBox: {
    marginTop: 16,
    marginLeft: 'auto',
    width: 220,
  },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottom: '1pt solid #f3f4f6',
  },
  totalesLabel: { fontSize: 10, color: '#6b7280' },
  totalesValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  totalFinalLabel: { fontSize: 11, color: '#fff', fontFamily: 'Helvetica-Bold' },
  totalFinalValue: { fontSize: 11, color: '#fff', fontFamily: 'Helvetica-Bold' },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 48,
    right: 48,
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#9ca3af' },
  badge: {
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  badgeText: { fontSize: 9, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
})

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function FacturaPDF({ factura }: { factura: FacturaConDatos }) {
  return (
    <Document title={`Factura ${factura.numero}`} author="CertiDocs">
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>CertiDocs</Text>
            <Text style={styles.brandSub}>{EMPRESA.nif}</Text>
            <Text style={styles.brandSub}>{EMPRESA.direccion}</Text>
            <Text style={styles.brandSub}>{EMPRESA.email}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNum}>{factura.numero}</Text>
            <Text style={styles.invoiceNum}>Fecha: {fmtDate(factura.fechaEmision)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Pagado badge + datos cliente */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PAGADO</Text>
        </View>

        <View style={styles.twoCol}>
          <View>
            <Text style={styles.colLabel}>Facturado a</Text>
            <Text style={styles.colValue}>{factura.clienteNombre}</Text>
            <Text style={styles.colValue}>{factura.clienteEmail}</Text>
            {factura.clienteNif ? <Text style={styles.colValue}>NIF: {factura.clienteNif}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.colLabel}>Emisor</Text>
            <Text style={styles.colValue}>{EMPRESA.nombre}</Text>
            <Text style={styles.colValue}>NIF: {EMPRESA.nif}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Descripción</Text>
          <Text style={[styles.tableHeaderText, styles.colBase]}>Base imp.</Text>
          <Text style={[styles.tableHeaderText, styles.colIva]}>IVA ({factura.tipoIVA}%)</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={[{ fontSize: 10 }, styles.colDesc]}>{factura.concepto}</Text>
          <Text style={[{ fontSize: 10 }, styles.colBase]}>{fmt(factura.baseImponible)}</Text>
          <Text style={[{ fontSize: 10 }, styles.colIva]}>{fmt(factura.cuotaIVA)}</Text>
          <Text style={[{ fontSize: 10 }, styles.colTotal]}>{fmt(factura.total)}</Text>
        </View>

        {/* Totales */}
        <View style={styles.totalesBox}>
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>Base imponible</Text>
            <Text style={styles.totalesValue}>{fmt(factura.baseImponible)}</Text>
          </View>
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>IVA ({factura.tipoIVA}%)</Text>
            <Text style={styles.totalesValue}>{fmt(factura.cuotaIVA)}</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>TOTAL</Text>
            <Text style={styles.totalFinalValue}>{fmt(factura.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{EMPRESA.nombre} · NIF {EMPRESA.nif}</Text>
          <Text style={styles.footerText}>Documento generado electrónicamente</Text>
        </View>
      </Page>
    </Document>
  )
}
