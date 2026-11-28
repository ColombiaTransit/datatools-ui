// @flow

// $FlowFixMe Flow 0.84 predates React hooks.
import React, {type Node, useId, useState} from 'react'

import fileDownload from '../util/file-download'

const PAGE_SIZES = [10, 20, 50, 100]

export type TableColumn = {
  children: Node,
  colSpan?: string,
  csvHeader?: string,
  dataField?: string,
  dataFormat?: (any, Object, any, number) => Node,
  formatExtraData?: any,
  headerText?: string,
  hidden?: boolean,
  row?: string,
  rowSpan?: string,
  sortable?: boolean,
  width?: string
}

type Props = {
  columns: Array<TableColumn>,
  data: Array<Object>,
  exportCSV?: boolean,
  label: string,
  noDataText?: string,
  pageSize?: number,
  rowKey: string,
  search?: boolean,
  small?: boolean
}

function quoteCell (value: any): string {
  const text = value == null ? '' : String(value)
  return '"' + text.replace(/"/g, '""') + '"'
}

function headerRows (columns: Array<TableColumn>): Array<Array<TableColumn>> {
  const top = columns.filter(column => column.row !== '1')
  const bottom = columns.filter(column => column.row === '1')
  return bottom.length > 0 ? [top, bottom] : [top]
}

function exportRows (rows: Array<Object>, columns: Array<TableColumn>) {
  const headers = headerRows(columns).map(columns => columns
    .map(column => Array(Number(column.colSpan) || 1).fill(quoteCell(column.csvHeader || column.dataField)).join(','))
    .join(','))
  const fields = columns.map(column => column.dataField).filter(Boolean)
  const body = rows.map(row => fields.map(field => quoteCell(row[field])).join(','))
  fileDownload([...headers, ...body].join('\r\n') + '\r\n', 'spreadsheet.csv', 'text/csv;charset=utf-8')
}

function compareCells (left: any, right: any): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left == null ? '' : left).localeCompare(String(right == null ? '' : right))
}

export default function DataTable ({
  columns, data, exportCSV, label, noDataText = 'There is no data to display',
  pageSize = 10, rowKey, search, small
}: Props) {
  const sizeId = useId()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(null)
  const [size, setSize] = useState(pageSize)
  const [page, setPage] = useState(0)
  const visibleColumns = columns.filter(column => !column.hidden)
  const cellColumns = visibleColumns.filter(column => column.dataField != null)
  const needle = query.trim().toLowerCase()
  const terms = needle.split(/\s+/)
  const filtered = needle
    ? data.filter(row => cellColumns.some(({dataField}) => {
      const value = dataField != null ? row[dataField] : null
      const text = value == null ? '' : String(value).toLowerCase()
      return terms.every(term => text.includes(term))
    }))
    : data
  const rows = sort ? [...filtered].sort((a, b) =>
    sort.direction * compareCells(a[sort.field], b[sort.field])) : filtered
  const pageCount = Math.max(1, Math.ceil(rows.length / size))
  const last = pageCount - 1
  const current = Math.min(page, last)
  const first = current * size
  const toggleSort = (field: string) => {
    setSort({field, direction: sort && sort.field === field ? -sort.direction : 1})
    setPage(0)
  }

  return (
    <div className={small ? 'data-table data-table-small' : 'data-table'}>
      {(exportCSV || search) &&
        <div className='data-table-controls'>
          {exportCSV &&
            <button className='btn btn-default' disabled={!rows.length} onClick={() => exportRows(rows, visibleColumns)} type='button'>
              Export to CSV
            </button>}
          {search &&
            <input
              aria-label={`Search ${label}`}
              className='form-control'
              onChange={event => {
                setQuery(event.currentTarget.value)
                setPage(0)
              }}
              placeholder='Search'
              type='search'
              value={query}
            />}
        </div>}
      <div className='table-responsive'>
        <table aria-label={label} className='table table-bordered table-hover table-striped'>
          <thead>
            {headerRows(visibleColumns).map((columns, row) => (
              <tr key={row}>
                {columns.map(({children, colSpan, dataField, headerText, rowSpan, sortable, width}, index) => {
                  const direction = sort && sort.field === dataField ? sort.direction : 0
                  const widthValue = width && (/^\d+$/.test(width) ? `${width}px` : width)
                  return (
                    <th
                      aria-sort={direction ? (direction > 0 ? 'ascending' : 'descending') : undefined}
                      colSpan={Number(colSpan) || 1}
                      key={dataField || index}
                      rowSpan={Number(rowSpan) || 1}
                      scope={Number(colSpan) > 1 ? 'colgroup' : 'col'}
                      style={widthValue ? {width: widthValue, minWidth: widthValue} : undefined}
                      title={headerText}>
                      {sortable && dataField != null
                        ? <button className='data-table-sort' onClick={() => toggleSort(dataField)} type='button'>
                          {children} <span aria-hidden='true'>{direction ? (direction > 0 ? '▲' : '▼') : '↕'}</span>
                        </button>
                        : children}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={cellColumns.length}>{noDataText}</td></tr>}
            {rows.slice(first, first + size).map((row, index) => (
              <tr key={row[rowKey] == null ? first + index : row[rowKey]}>
                {cellColumns.map(({dataField, dataFormat, formatExtraData}) => {
                  if (dataField == null) return null
                  const value = row[dataField]
                  return <td key={dataField}>{dataFormat ? dataFormat(value, row, formatExtraData, first + index) : value}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='data-table-controls' role='group' aria-label={`${label} pagination`}>
        <label htmlFor={sizeId}>
          Rows per page
          {/* Selecting a size updates the rows while keeping focus on the select. */}
          {/* eslint-disable-next-line jsx-a11y/no-onchange */}
          <select className='form-control input-sm' id={sizeId} value={size} onChange={event => {
            setSize(Number(event.currentTarget.value))
            setPage(0)
          }}>
            {PAGE_SIZES.map(count => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
        <span aria-live='polite'>{rows.length ? first + 1 : 0}–{Math.min(first + size, rows.length)} of {rows.length}</span>
        <button className='btn btn-default btn-sm' disabled={current === 0} onClick={() => setPage(current - 1)} type='button'>
          Previous
        </button>
        {pageCount > 1 &&
          // Selecting a page updates the rows while keeping focus on the select.
          // eslint-disable-next-line jsx-a11y/no-onchange
          <select aria-label={`${label} page`} className='form-control input-sm' value={current} onChange={event => setPage(Number(event.currentTarget.value))}>
            {Array.from({length: pageCount}, (_, index) => <option key={index} value={index}>{index + 1}</option>)}
          </select>}
        <button className='btn btn-default btn-sm' disabled={current === last} onClick={() => setPage(current + 1)} type='button'>
          Next
        </button>
      </div>
    </div>
  )
}
