'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { ShiftReportForm, DowntimeEvent, MaintenanceRequest } from '@/types'

// Styling
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b', // Amber primary
    paddingBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0d0d0f',
  },
  meta: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#0d0d0f',
    color: '#fff',
    padding: '4 8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: '#000',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 20,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
})

interface PDFProps {
  report: ShiftReportForm
  plantName?: string
}

export function ShiftReportPDF({ report, plantName = 'PassdownPro Plant' }: PDFProps) {
  const performance = report.units_produced && report.units_target 
    ? Math.round(((report.units_produced as number) / (report.units_target as number)) * 100)
    : 0

  return (
    <Document title={`Shift Report - ${report.date} - ${report.shift}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SHIFT REPORT</Text>
            <Text style={styles.meta}>{plantName}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{report.shift.toUpperCase()} SHIFT</Text>
            <Text style={{ fontSize: 11 }}>{report.date}</Text>
          </View>
        </View>

        {/* Shift Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Supervisor</Text>
            <Text style={styles.value}>{report.supervisor_name}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Performance</Text>
            <Text style={[styles.value, { color: performance >= 100 ? '#10b981' : '#ef4444' }]}>
              {performance}%
            </Text>
          </View>
        </View>

        {/* Production Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production Metrics</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Units Produced</Text>
              <Text style={styles.value}>{report.units_produced || 0}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Target</Text>
              <Text style={styles.value}>{report.units_target || 0}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Reject Count</Text>
              <Text style={styles.value}>{report.quality_issues.reject_count}</Text>
            </View>
          </View>
        </View>

        {/* Downtime Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downtime Events</Text>
          {report.downtime_events.length > 0 ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Machine</Text>
                <Text style={styles.tableCell}>Duration (m)</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>Reason</Text>
              </View>
              {report.downtime_events.map((e, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{e.machine}</Text>
                  <Text style={styles.tableCell}>{e.duration_minutes}</Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{e.reason}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#999', fontStyle: 'italic' }}>No downtime recorded.</Text>
          )}
        </View>

        {/* Maintenance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Requests</Text>
          {report.maintenance_requests.length > 0 ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Equipment</Text>
                <Text style={styles.tableCell}>Priority</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>Issue</Text>
              </View>
              {report.maintenance_requests.map((r, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{r.equipment}</Text>
                  <Text style={[styles.tableCell, { color: r.priority === 'high' ? '#ef4444' : '#000' }]}>
                    {r.priority.toUpperCase()}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{r.description}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#999', fontStyle: 'italic' }}>No maintenance requests.</Text>
          )}
        </View>

        {/* Safety & Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Incidents</Text>
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Incident Count: {report.safety_incidents.count}</Text>
            {report.safety_incidents.count > 0 && (
              <Text style={styles.value}>{report.safety_incidents.description}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handoff Notes</Text>
          <Text style={[styles.value, { lineHeight: 1.4 }]}>
            {report.handoff_notes || 'No handoff notes provided.'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by PassdownPro — {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
